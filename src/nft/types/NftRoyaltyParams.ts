import { Address, Builder, Slice } from '@ton/core';

export type NftRoyaltyParams = {
    numerator: bigint;
    denominator: bigint;
    recipient: Address;
};

export function storeNftRoyaltyParams(src: NftRoyaltyParams) {
    return (builder: Builder) => {
        builder.storeUint(src.numerator, 16);
        builder.storeUint(src.denominator, 16);
        builder.storeAddress(src.recipient);
    };
}

export function loadNftRoyaltyParams(slice: Slice): NftRoyaltyParams {
    return {
        numerator: slice.loadUintBig(16),
        denominator: slice.loadUintBig(16),
        recipient: slice.loadAddress(),
    };
}
