import {Address, beginCell, Builder, Cell, Slice} from "@ton/core";
import {loadNftRoyaltyParams, NftRoyaltyParams, storeNftRoyaltyParams} from "./NftRoyaltyParams";

export type NftCollectionData = {
    admin: Address,
    content: Cell,
    itemCode: Cell,
    royalty: NftRoyaltyParams,
}

export function storeNftCollectionData(src: NftCollectionData) {
    return (builder: Builder) => {
        builder.storeAddress(src.admin);
        builder.storeUint(0, 64);
        builder.storeRef(src.content);
        builder.storeRef(src.itemCode);
        builder.storeRef(beginCell().store(storeNftRoyaltyParams(src.royalty)).endCell());
    };
}

export function loadNftCollectionData(slice: Slice): NftCollectionData {
    return {
        admin: slice.loadAddress(),
        content: slice.loadRef(),
        itemCode: slice.loadRef(),
        royalty: loadNftRoyaltyParams(slice),
    };
}
