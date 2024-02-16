import {Address, Builder, Cell, Slice} from "@ton/core";

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
    forwardPayload?: Cell | null;
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
