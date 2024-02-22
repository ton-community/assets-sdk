import {Address, beginCell, Builder, Cell, Slice} from "@ton/core";
import {JETTON_MINT_OPCODE} from "../opcodes";

import {loadJettonInternalTransferMessage, storeJettonInternalTransferMessage} from "./JettonInternalTransferMessage";

export type JettonMintMessage = {
    queryId: bigint,
    amount: bigint,
    from: Address,
    to: Address,
    responseAddress: Address | null,
    forwardPayload: Cell | null,
    forwardTonAmount: bigint;
    walletForwardValue: bigint;
}

export function storeJettonMintMessage(src: JettonMintMessage) {
    return (builder: Builder) => {
        builder.storeUint(JETTON_MINT_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeAddress(src.to);
        builder.storeCoins(src.walletForwardValue);
        builder.storeRef(beginCell().store(storeJettonInternalTransferMessage(src)).endCell());
    }
}

export function loadJettonMintMessage(slice: Slice): JettonMintMessage {
    if (slice.loadUint(32) !== JETTON_MINT_OPCODE) {
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
