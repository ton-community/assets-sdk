import { Builder, Cell, Slice } from '@ton/core';

import { loadNftRoyaltyParams, NftRoyaltyParams, storeNftRoyaltyParams } from './NftRoyaltyParams';
import { NFT_CHANGE_CONTENT_OPCODE } from '../opcodes';

export type NftChangeContentMessage = {
    queryId: bigint;
    newContent: Cell;
    newRoyaltyParams: NftRoyaltyParams;
};

export function storeNftChangeContentMessage(src: NftChangeContentMessage): (builder: Builder) => void {
    return (builder: Builder) => {
        builder.storeUint(NFT_CHANGE_CONTENT_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeRef(src.newContent);
        builder.store(storeNftRoyaltyParams(src.newRoyaltyParams));
    };
}

export function loadNftChangeContentMessage(slice: Slice): NftChangeContentMessage {
    if (slice.loadUint(32) !== NFT_CHANGE_CONTENT_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const newContent = slice.loadRef();
    const newRoyaltyParams = loadNftRoyaltyParams(slice.loadRef().beginParse());
    return {
        queryId,
        newContent,
        newRoyaltyParams,
    };
}
