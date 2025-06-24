import { Address, Builder, Slice } from '@ton/core';

import { JETTON_CHANGE_ADMIN_OPCODE } from '../opcodes';

export type JettonChangeAdminMessage = {
    queryId: bigint;
    newAdmin: Address;
};

export function storeJettonChangeAdminMessage(src: JettonChangeAdminMessage) {
    return (builder: Builder) => {
        builder.storeUint(JETTON_CHANGE_ADMIN_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeAddress(src.newAdmin);
    };
}

export function loadJettonChangeAdminMessage(slice: Slice): JettonChangeAdminMessage {
    if (slice.loadUint(32) !== JETTON_CHANGE_ADMIN_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const newAdmin = slice.loadAddress();

    return {
        queryId,
        newAdmin,
    };
}
