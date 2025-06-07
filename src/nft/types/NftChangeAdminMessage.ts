import { Address, Builder, Slice } from '@ton/core';

import { NFT_CHANGE_ADMIN_OPCODE } from '../opcodes';

export type NftChangeAdminMessage = {
    queryId: bigint;
    newAdmin: Address;
};

export function storeNftChangeAdminMessage(src: NftChangeAdminMessage): (builder: Builder) => void {
    return (builder: Builder) => {
        builder.storeUint(NFT_CHANGE_ADMIN_OPCODE, 32);
        builder.storeUint(src.queryId ?? 0, 64);
        builder.storeAddress(src.newAdmin);
    };
}

export function loadNftChangeAdminMessage(slice: Slice): NftChangeAdminMessage {
    if (slice.loadUint(32) !== NFT_CHANGE_ADMIN_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const newAdmin = slice.loadAddress();
    return {
        queryId,
        newAdmin,
    };
}
