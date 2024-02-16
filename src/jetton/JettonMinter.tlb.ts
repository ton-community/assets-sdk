import {Address, beginCell, Builder, Cell, Slice, toNano} from "@ton/core";

export interface JettonMinterData {
    totalSupply: bigint,
    mintable: boolean,
    adminAddress: Address | null,
    jettonContent: Cell,
    jettonWalletCode: Cell,
}

export type JettonMintMessage = {
    queryId?: bigint,
    amount: bigint,
    from?: Address,
    to: Address,
    responseAddress?: Address | null,
    forwardPayload?: Cell | null,
    forwardTonAmount?: bigint;
    walletForwardValue: bigint;
}

export function storeJettonMintMessage(src: JettonMintMessage) {
    return (builder: Builder) => {
        const mintOpcode = 21;
        const queryId = src.queryId ?? 0;
        const walletForwardValue = src.walletForwardValue;

        builder.storeUint(mintOpcode, 32);
        builder.storeUint(queryId, 64);
        builder.storeAddress(src.to);
        builder.storeCoins(walletForwardValue);
        builder.storeRef(beginCell().store(storeJettonInternalTransferMessage(src)).endCell());
    }
}

export function loadJettonMintMessage(slice: Slice): JettonMintMessage {
    const mintOpcode = 21;
    if (slice.loadUint(32) !== mintOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const to = slice.loadAddress();
    const walletForwardValue = slice.loadCoins();
    const internalTransfer = loadJettonInternalTransferMessage(slice.loadRef().beginParse());

    return {
        queryId,
        amount: internalTransfer.amount,
        from: internalTransfer.from,
        to,
        responseAddress: internalTransfer.responseAddress,
        forwardTonAmount: internalTransfer.forwardTonAmount,
        forwardPayload: internalTransfer.forwardPayload,
        walletForwardValue,
    }
}

export type JettonInternalTransferMessage = {
    queryId?: bigint,
    amount: bigint,
    from?: Address,
    responseAddress?: Address | null,
    forwardTonAmount?: bigint,
    forwardPayload?: Cell | null,
}

export function storeJettonInternalTransferMessage(src: JettonInternalTransferMessage) {
    return (builder: Builder) => {
        const internalTransferOpcode = 0x178d4519;
        const queryId = src.queryId ?? 0;
        const forwardTonAmount = src.forwardTonAmount ?? 0;
        const forwardPayload = src.forwardPayload ?? null;

        builder.storeUint(internalTransferOpcode, 32);
        builder.storeUint(queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.from);
        builder.storeAddress(src.responseAddress);
        builder.storeCoins(forwardTonAmount);
        builder.storeMaybeRef(forwardPayload);
    }
}

export function loadJettonInternalTransferMessage(slice: Slice): JettonInternalTransferMessage {
    const internalTransferOpcode = 0x178d4519;
    if (slice.loadUint(32) !== internalTransferOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const from = slice.loadAddress();
    const responseAddress = slice.loadAddress();
    const forwardTonAmount = slice.loadCoins();
    const forwardPayload = slice.loadMaybeRef();

    return {
        queryId,
        amount,
        from,
        responseAddress,
        forwardTonAmount,
        forwardPayload,
    }
}

export type JettonMinterContent = {
    admin: Address,
    content: Cell,
    jettonWalletCode: Cell,
};

export function storeJettonMinterContent(src: JettonMinterContent) {
    return (builder: Builder) => {
        builder.storeCoins(0);
        builder.storeAddress(src.admin);
        builder.storeRef(src.content);
        builder.storeRef(src.jettonWalletCode);
    }
}

export function loadJettonMinterContent(slice: Slice): JettonMinterContent {
    const totalSupply = slice.loadCoins();
    const adminAddress = slice.loadAddress();
    const jettonContent = slice.loadRef();
    const jettonWalletCode = slice.loadRef();

    return {
        admin: adminAddress,
        content: jettonContent,
        jettonWalletCode,
    }
}

export type JettonChangeAdminMessage = {
    queryId?: bigint,
    newAdmin: Address,
}

export function storeJettonChangeAdminMessage(src: JettonChangeAdminMessage) {
    return (builder: Builder) => {
        const changeAdminOpcode = 3;
        const queryId = src.queryId ?? 0;

        builder.storeUint(changeAdminOpcode, 32);
        builder.storeUint(queryId, 64);
        builder.storeAddress(src.newAdmin);
    }
}

export function loadJettonChangeAdminMessage(slice: Slice): JettonChangeAdminMessage {
    const changeAdminOpcode = 3;
    if (slice.loadUint(32) !== changeAdminOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const newAdmin = slice.loadAddress();

    return {
        queryId,
        newAdmin,
    }
}

export type JettonChangeContentMessage = {
    queryId?: bigint,
    newContent: Cell,
}

export function storeJettonChangeContentMessage(src: JettonChangeContentMessage) {
    return (builder: Builder) => {
        const changeContentOpcode = 4;
        const queryId = src.queryId ?? 0;

        builder.storeUint(changeContentOpcode, 32);
        builder.storeUint(queryId, 64);
        builder.storeRef(src.newContent);
    }
}
