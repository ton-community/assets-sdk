import {
    Address,
    beginCell,
    Builder,
    Cell,
    Contract,
    ContractProvider,
    Sender,
    SendMode,
    Slice,
    toNano,
} from "@ton/core";
import {NoSenderError} from "../error";
import {jettonWalletCode} from "./contracts/build/jetton-wallet";

export interface JettonWalletData {
    balance: bigint,
    owner: Address,
    jetton: Address,
    code: Cell,
}

export interface JettonTransferMessage {
    queryId?: bigint;
    amount: bigint;
    to: Address;
    responseDestination?: Address | null;
    customPayload?: Cell | null;
    forwardAmount?: bigint;
    forwardPayload?: Cell;
}

export function storeJettonTransferMessage(src: JettonTransferMessage) {
    return (builder: Builder) => {
        const transferOpcode = 0x0f8a7ea5;
        const queryId = src.queryId ?? 0;

        builder.storeUint(transferOpcode, 32);
        builder.storeUint(queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.to);
        builder.storeAddress(src.responseDestination);
        builder.storeMaybeRef(src.customPayload);
        builder.storeCoins(src.forwardAmount ?? 0);
        builder.storeMaybeRef(src.forwardPayload);
    };
}

export function loadJettonTransferMessage(slice: Slice): JettonTransferMessage {
    const transferOpcode = 0x0f8a7ea5;
    if (slice.loadUint(32) !== transferOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const to = slice.loadAddress();
    const responseDestination = slice.loadMaybeAddress();
    const customPayload = slice.loadMaybeRef();
    const forwardAmount = slice.loadCoins();
    const forwardPayloadIsRight = slice.loadBoolean();
    const forwardPayload = forwardPayloadIsRight ? slice.loadRef() : slice.asCell();
    return {
        queryId,
        amount,
        to,
        responseDestination,
        customPayload,
        forwardAmount,
        forwardPayload,
    };
}

export type JettonBurnMessage = {
    queryId?: bigint;
    amount: bigint;
    responseDestination?: Address | null;
    customPayload?: Cell | null;
}

export function storeJettonBurnMessage(src: JettonBurnMessage) {
    return (builder: Builder) => {
        const burnOpcode = 0x595f07bc;
        const queryId = src.queryId ?? 0;

        builder.storeUint(burnOpcode, 32);
        builder.storeUint(queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.responseDestination);
        builder.storeMaybeRef(src.customPayload);
    }
}

export function loadJettonBurnMessage(slice: Slice): JettonBurnMessage {
    const burnOpcode = 0x595f07bc;
    if (slice.loadUint(32) !== burnOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const responseDestination = slice.loadMaybeAddress();
    const customPayload = slice.loadMaybeRef();
    return {
        queryId,
        amount,
        responseDestination,
        customPayload,
    };
}

export class JettonWallet implements Contract {
    static code = Cell.fromBase64(jettonWalletCode.codeBoc);

    constructor(public readonly address: Address, public sender?: Sender) {
    }

    async sendTransfer(provider: ContractProvider, message: JettonTransferMessage, args?: { value: bigint, bounce: boolean }) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.05'),
            bounce: args?.bounce ?? true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeJettonTransferMessage({
                queryId: message.queryId,
                amount: message.amount,
                to: message.to,
                responseDestination: message.responseDestination ?? this.sender.address,
                customPayload: message.customPayload,
                forwardAmount: message.forwardAmount,
                forwardPayload: message.forwardPayload,
            })).endCell(),
        });
    }

    async sendBurn(provider: ContractProvider, message: JettonBurnMessage, args?: { value: bigint, bounce: boolean }) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.02'),
            bounce: args?.bounce ?? true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeJettonBurnMessage({
                queryId: message.queryId,
                amount: message.amount,
                responseDestination: message.responseDestination ?? this.sender.address,
                customPayload: message.customPayload,
            })).endCell(),
        });
    }

    async getData(provider: ContractProvider): Promise<JettonWalletData> {
        const {stack} = await provider.get('get_wallet_data', []);
        return {
            balance: stack.readBigNumber(),
            owner: stack.readAddress(),
            jetton: stack.readAddress(),
            code: stack.readCell(),
        };
    }
}
