import {Builder, Slice} from "@ton/core";
import {NFT_GET_STATIC_DATA_OPCODE} from "../opcodes";

export type NftGetStaticDataMessage = {
    queryId: bigint;
};

export function storeNftGetStaticDataMessage(message: NftGetStaticDataMessage): (builder: Builder) => void {
    return (builder) => {
        const {queryId} = message;
        builder.storeUint(NFT_GET_STATIC_DATA_OPCODE, 32)
            .storeUint(queryId, 64);
    };
}

export function loadNftGetStaticDataMessage(slice: Slice): NftGetStaticDataMessage {
    if (slice.loadUint(32) !== NFT_GET_STATIC_DATA_OPCODE) {
        throw new Error('Wrong opcode');
    }
    const queryId = slice.loadUintBig(64);
    return {
        queryId,
    };
}
