import { Builder, Slice } from '@ton/core';

import { JETTON_EXCESSES_OPCODE } from '../opcodes';

// excesses query_id:uint64 = InternalMsgBody;
export type JettonExcessesMessage = {
    queryId: bigint;
};

export function storeJettonExcessesMessage(src: JettonExcessesMessage): (builder: Builder) => void {
    return (builder: Builder) => {
        builder.storeUint(JETTON_EXCESSES_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
    };
}

export function loadJettonExcessesMessage(slice: Slice): JettonExcessesMessage {
    if (slice.loadUint(32) !== JETTON_EXCESSES_OPCODE) {
        throw new Error('Wrong opcode');
    }

    let queryId = slice.loadUintBig(64);
    return {
        queryId,
    };
}
