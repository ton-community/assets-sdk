import {Builder, Slice} from "@ton/core";
import {NFT_EXCESSES_OPCODE} from "../opcodes";

export type NftExcessesMessage = {
    queryId: bigint;
}

export function storeNftExcessesMessage(message: NftExcessesMessage): (builder: Builder) => void {
    return (builder) => {
        const {queryId} = message;
        builder.storeUint(NFT_EXCESSES_OPCODE, 32)
            .storeUint(queryId, 64);
    };
}

export function loadNftExcessesMessage(slice: Slice): NftExcessesMessage {
    if (slice.loadUint(32) !== NFT_EXCESSES_OPCODE) {
        throw new Error('Wrong opcode');
    }
    const queryId = slice.loadUintBig(64);
    return {
        queryId,
    };
}
