import {Address, beginCell, Builder, Cell, Slice} from "@ton/core";

export type NftRoyaltyParams = {
    numerator: bigint,
    denominator: bigint,
    recipient: Address,
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

export type NftItemParams = {
    owner: Address;
    individualContent: Cell | string;
};

export type StoreParams<T> = (params: T) => (builder: Builder) => void;

export type LoadParams<T> = (slice: Slice) => T;

export type ParamsValue<T> = {
    store: StoreParams<T>;
    load: LoadParams<T>;
}

export type NftItemParamsValue = ParamsValue<NftItemParams>;

export function storeNftItemParams(src: NftItemParams) {
    return (builder: Builder) => {
        builder.storeAddress(src.owner);
        if (typeof src.individualContent === 'string') {
            builder.storeRef(beginCell().storeStringTail(src.individualContent).endCell());
        } else {
            builder.storeRef(src.individualContent);
        }
    };
}

export function loadNftItemParams(slice: Slice): NftItemParams & { individualContent: Cell } {
    return {
        owner: slice.loadAddress(),
        individualContent: slice.loadRef(),
    };
}

export function createNftItemParamsValue(): NftItemParamsValue {
    return {
        store: storeNftItemParams,
        load: loadNftItemParams,
    };
}
