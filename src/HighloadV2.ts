import { Contract, Address, Cell, SendMode, MessageRelaxed, Dictionary, beginCell, storeMessageRelaxed, ContractProvider, contractAddress } from "@ton/core";
import { sign } from "@ton/crypto";
import { sleep } from "./utils";

export class HighloadWalletV2 implements Contract {
    static code = Cell.fromBase64('te6cckEBCQEA5QABFP8A9KQT9LzyyAsBAgEgAgMCAUgEBQHq8oMI1xgg0x/TP/gjqh9TILnyY+1E0NMf0z/T//QE0VNggED0Dm+hMfJgUXO68qIH+QFUEIf5EPKjAvQE0fgAf44WIYAQ9HhvpSCYAtMH1DAB+wCRMuIBs+ZbgyWhyEA0gED0Q4rmMQHIyx8Tyz/L//QAye1UCAAE0DACASAGBwAXvZznaiaGmvmOuF/8AEG+X5dqJoaY+Y6Z/p/5j6AmipEEAgegc30JjJLb/JXdHxQANCCAQPSWb6VsEiCUMFMDud4gkzM2AZJsIeKzn55UWg==');

    constructor(public readonly address: Address, public readonly init?: { code: Cell, data: Cell }, public readonly walletId: number = 0) {}

    static create(params: {
        workchain: number,
        publicKey: Buffer,
        walletId?: number,
    }) {
        const walletId = params.walletId ?? 0;
        const data = beginCell()
            .storeUint(walletId, 32)
            .storeUint(0, 64)
            .storeBuffer(params.publicKey, 32)
            .storeDict(null)
            .endCell();
        const init = { code: HighloadWalletV2.code, data };
        return new HighloadWalletV2(contractAddress(params.workchain, init), init, walletId);
    }

    static createFromAddress(address: Address) {
        return new HighloadWalletV2(address);
    }

    static makeQueryId(timeout?: number | null, seqno?: number | null) {
        const to = typeof timeout === 'number' ? timeout : 3600;
        const seq = typeof seqno === 'number' ? seqno : Math.floor(Math.random() * (1 << 32));
        return (BigInt(Math.floor(Date.now() / 1000) + to) << 32n) + BigInt(seq);
    }

    private _createTransfer(args: {
        seqno?: number | null;
        sendMode?: SendMode | null;
        secretKey: Buffer;
        messages: MessageRelaxed[];
        timeout?: number | null;
    }) {
        const queryId = HighloadWalletV2.makeQueryId(args.timeout, args.seqno);
        const dict: Dictionary<number, MessageRelaxed> = Dictionary.empty(Dictionary.Keys.Int(16), {
            serialize: (m, b) => {
                b.storeUint(args.sendMode ?? (SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS), 8);
                b.storeRef(beginCell().storeWritable(storeMessageRelaxed(m)));
            },
            parse: () => { throw new Error('Unsupported') },
        });
        for (let i = 0; i < args.messages.length; i++) {
            dict.set(i, args.messages[i]);
        }
        const signedMessage = beginCell()
            .storeUint(this.walletId, 32)
            .storeUint(queryId, 64)
            .storeDict(dict)
            .endCell();
        const hash = signedMessage.hash();
        const signature = sign(hash, args.secretKey);
        return {
            queryId,
            transfer: beginCell()
                .storeBuffer(signature)
                .storeSlice(signedMessage.beginParse())
                .endCell(),
        };
    }

    createTransfer(args: {
        seqno?: number | null;
        sendMode?: SendMode | null;
        secretKey: Buffer;
        messages: MessageRelaxed[];
        timeout?: number | null;
    }) {
        return this._createTransfer(args).transfer;
    }

    async sendTransfer(provider: ContractProvider, args: {
        seqno?: number | null;
        sendMode?: SendMode | null;
        secretKey: Buffer;
        messages: MessageRelaxed[];
        timeout?: number | null;
    }) {
        await provider.external(this.createTransfer(args));
    }

    async getProcessedStatus(provider: ContractProvider, arg: bigint | { timeout: number, seqno: number }) {
        const queryId = typeof arg === 'bigint' ? arg : HighloadWalletV2.makeQueryId(arg.timeout, arg.seqno);
        const ret = (await provider.get('processed?', [{ type: 'int', value: queryId }])).stack.readBigNumber();
        switch (ret) {
            case -1n:
                return 'processed';
            case 0n:
                return 'unprocessed';
            case 1n:
                return 'forgotten';
            default:
                throw new Error('Unknown processed status ' + ret);
        }
    }

    async getPublicKey(provider: ContractProvider) {
        const ret = (await provider.get('get_public_key', [])).stack.readBigNumber();
        return Buffer.from(ret.toString(16), 'hex');
    }

    async sendTransferAndWait(provider: ContractProvider, args: {
        seqno?: number | null;
        sendMode?: SendMode | null;
        secretKey: Buffer;
        messages: MessageRelaxed[];
        timeout?: number | null;
    }, sleepInterval: number = 3000) {
        const { queryId, transfer } = this._createTransfer(args);
        await provider.external(transfer);
        while (true) {
            await sleep(sleepInterval);
            const state = await provider.getState();
            if (state.state.type === 'uninit') continue;
            const status = await this.getProcessedStatus(provider, queryId);
            if (status === 'processed') return;
            else if (status === 'forgotten') throw new Error('The transfer was forgotten');
            try {
                await provider.external(transfer);
            } catch (e) {}
        }
    }
}
