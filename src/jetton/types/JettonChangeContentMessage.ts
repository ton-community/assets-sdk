import {Builder, Cell, Slice} from "@ton/core";
import {JETTON_CHANGE_CONTENT_OPCODE} from "../opcodes";

export type JettonChangeContentMessage = {
    queryId: bigint,
    newContent: Cell,
}

export function storeJettonChangeContentMessage(src: JettonChangeContentMessage) {
    return (builder: Builder) => {
        builder.storeUint(JETTON_CHANGE_CONTENT_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeRef(src.newContent);
    }
}

export function loadJettonChangeContentMessage(slice: Slice): JettonChangeContentMessage {
    if (slice.loadUint(32) !== JETTON_CHANGE_CONTENT_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const newContent = slice.loadRef();

    return {
        queryId,
        newContent,
    }
}
