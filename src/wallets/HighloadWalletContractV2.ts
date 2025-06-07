import {
    Address,
    beginCell,
    Builder,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    internal,
    loadMessageRelaxed,
    MessageRelaxed,
    Sender,
    SenderArguments,
    SendMode,
    Slice,
    storeMessageRelaxed,
} from '@ton/core';
import { Maybe } from '@ton/ton/dist/utils/maybe';
import { sign } from '@ton/crypto';

import { sleep } from '../utils';

export class HighloadWalletContractV2 implements Contract {
    public readonly workchain: number;
    public readonly publicKey: Buffer;
    public readonly address: Address;
    public readonly walletId: number;
    public readonly init: { code: Cell; data: Cell };

    private constructor(workchain: number, publicKey: Buffer, walletId?: Maybe<number>) {
        this.workchain = workchain;
        this.publicKey = publicKey;
        if (walletId !== null && walletId !== undefined) {
            this.walletId = walletId;
        } else {
            this.walletId = 698983191 + workchain;
        }

        // Reference: https://github.com/ton-blockchain/ton/blob/master/crypto/smartcont/highload-wallet-v2-code.fc
        const code = Cell.fromBase64(
            'te6cckEBCQEA5QABFP8A9KQT9LzyyAsBAgEgAgMCAUgEBQHq8oMI1xgg0x/TP/gjqh9TILnyY+1E0NMf0z/T//QE0VNggED0Dm+hMfJgUXO68qIH+QFUEIf5EPKjAvQE0fgAf44WIYAQ9HhvpSCYAtMH1DAB+wCRMuIBs+ZbgyWhyEA0gED0Q4rmMQHIyx8Tyz/L//QAye1UCAAE0DACASAGBwAXvZznaiaGmvmOuF/8AEG+X5dqJoaY+Y6Z/p/5j6AmipEEAgegc30JjJLb/JXdHxQANCCAQPSWb6VsEiCUMFMDud4gkzM2AZJsIeKzn55UWg==',
        );
        const data = beginCell()
            .storeUint(this.walletId, 32)
            .storeUint(0, 64)
            .storeBuffer(this.publicKey, 32)
            .storeDict(null)
            .endCell();
        this.init = { code, data };
        this.address = contractAddress(this.workchain, this.init);
    }

    static create(args: { workchain: number; publicKey: Buffer; walletId?: Maybe<number> }) {
        return new HighloadWalletContractV2(args.workchain, args.publicKey, args.walletId);
    }

    /**
     * Get wallet balance.
     */
    public async getBalance(provider: ContractProvider): Promise<bigint> {
        const state = await provider.getState();
        return state.balance;
    }

    /**
     * Send signed message.
     */
    public async send(provider: ContractProvider, message: Cell): Promise<void> {
        await provider.external(message);
    }

    /**
     * Sign and send message.
     */
    public async sendTransfer(
        provider: ContractProvider,
        args: {
            secretKey: Buffer;
            messages: MessageRelaxed[];
            seqno?: Maybe<number>;
            sendMode?: Maybe<SendMode>;
            timeout?: Maybe<number>;
        },
    ) {
        const message = this.createTransfer(args);
        await this.send(provider, message);
    }

    /**
     * Create signed message.
     */
    public createTransfer(args: {
        secretKey: Buffer;
        messages: MessageRelaxed[];
        seqno?: Maybe<number>;
        sendMode?: Maybe<SendMode>;
        now?: Maybe<number>;
        timeout?: Maybe<number>;
    }): Cell {
        let seqno = Math.floor(Math.random() * (1 << 32));
        if (args.seqno !== null && args.seqno !== undefined) {
            seqno = args.seqno;
        }

        let timeout = 5 * 60; // 15 minutes
        if (args.timeout !== null && args.timeout !== undefined && args.timeout < timeout) {
            timeout = args.timeout;
        }

        let sendMode: SendMode = SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS;
        if (args.sendMode !== null && args.sendMode !== undefined) {
            sendMode = args.sendMode;
        }

        let now = Date.now();
        if (args.now !== null && args.now !== undefined) {
            now = args.now;
        }

        return beginCell()
            .store(
                storeSignedTransferHighloadWalletV2({
                    secretKey: args.secretKey,
                    messages: args.messages,
                    seqno: seqno,
                    sendMode: sendMode,
                    timeout: timeout,
                    walletId: this.walletId,
                    now: now,
                }),
            )
            .endCell();
    }

    /**
     * Load signed message.
     */
    public loadTransfer(src: Slice) {
        return loadSignedTransferHighloadWalletV2(src);
    }

    /**
     * Send signed message and wait for processing.
     */
    public async sendTransferAndWait(
        provider: ContractProvider,
        args: {
            seqno?: number | null;
            sendMode?: SendMode | null;
            secretKey: Buffer;
            messages: MessageRelaxed[];
            timeout?: number | null;
        },
        sleepInterval: number = 3000,
    ) {
        const transfer = this.createTransfer(args);
        const { queryId } = this.loadTransfer(transfer.beginParse());

        while (true) {
            try {
                await provider.external(transfer);
                // eslint-disable-next-line no-empty
            } catch (_) {}

            await sleep(sleepInterval);
            const state = await provider.getState();
            if (state.state.type === 'uninit') {
                continue;
            }
            const status = await this.getProcessedStatus(provider, queryId);
            if (status === 'processed') {
                return;
            } else if (status === 'forgotten') {
                throw new Error('The transfer was forgotten');
            }
        }
    }

    /**
     * Get processed status of message.
     */
    public async getProcessedStatus(provider: ContractProvider, queryId: bigint) {
        const { stack } = await provider.get('processed?', [{ type: 'int', value: queryId }]);

        const processedStatus = stack.readBigNumber();
        switch (processedStatus) {
            case -1n:
                return 'processed';
            case 0n:
                return 'unprocessed';
            case 1n:
                return 'forgotten';
            default:
                throw new Error('Unknown processed status ' + processedStatus);
        }
    }

    /**
     * Create sender.
     */
    sender(provider: ContractProvider, secretKey: Buffer): Sender {
        return {
            send: async (args: SenderArguments) => {
                await this.sendTransferAndWait(provider, {
                    secretKey: secretKey,
                    sendMode: args.sendMode,
                    messages: [
                        internal({
                            to: args.to,
                            value: args.value,
                            bounce: args.bounce,
                            init: args.init,
                            body: args.body,
                        }),
                    ],
                });
            },
            address: this.address,
        };
    }
}

type MessageRelaxedValue = {
    sendMode: SendMode;
    message: MessageRelaxed;
};

function createMessageRelaxedValue() {
    return {
        serialize: (args: MessageRelaxedValue, builder: Builder) => {
            const { sendMode, message } = args;
            const messageRelaxed = beginCell().storeWritable(storeMessageRelaxed(message));

            builder.storeUint(sendMode, 8);
            builder.storeRef(messageRelaxed);
        },
        parse: (src: Slice): MessageRelaxedValue => {
            const sendMode = src.loadUint(8);
            const message = loadMessageRelaxed(src.loadRef().beginParse());
            return { sendMode, message };
        },
    };
}

function getQueryId(now: number, timeout: number, seqno: number) {
    const validUntil = Math.floor(now / 1000) + timeout;
    return (BigInt(validUntil) << 32n) + BigInt(seqno);
}

function storeSignedTransferHighloadWalletV2(args: {
    secretKey: Buffer;
    messages: MessageRelaxed[];
    seqno: number;
    sendMode: SendMode;
    now: number;
    timeout: number;
    walletId: number;
}) {
    return (builder: Builder) => {
        const { secretKey, messages, seqno, sendMode, now, timeout, walletId } = args;
        const queryId = getQueryId(now, timeout, seqno);

        const dict = Dictionary.empty(Dictionary.Keys.Int(16), createMessageRelaxedValue());
        for (const [i, message] of messages.entries()) {
            dict.set(i, { sendMode, message });
        }
        const signedMessage = beginCell().storeUint(walletId, 32).storeUint(queryId, 64).storeDict(dict).endCell();
        const hash = signedMessage.hash();
        const signature = sign(hash, secretKey);

        builder.storeBuffer(signature);
        builder.storeSlice(signedMessage.beginParse());
    };
}

function loadSignedTransferHighloadWalletV2(src: Slice) {
    const signature = src.loadBuffer(64);
    const walletId = src.loadUint(32);
    const queryId = src.loadUintBig(64);

    const dict = src.loadDict(Dictionary.Keys.Int(16), createMessageRelaxedValue());
    const messages: MessageRelaxedValue[] = dict.values();

    return {
        signature: signature,
        walletId: walletId,
        queryId: queryId,
        messages: messages,
    };
}
