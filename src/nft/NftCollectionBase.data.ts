import {
    Address,
    beginCell,
    Builder, Cell,
    Dictionary,
    DictionaryValue,
    Slice,
    toNano
} from "@ton/core";
import {
    loadNftRoyaltyParams,
    LoadParams,
    NftRoyaltyParams,
    storeNftRoyaltyParams,
    StoreParams
} from "./NftCollection.data";

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

export type NftMintMessage<T> = {
    itemIndex: bigint,
    value: bigint,
    itemParams: T,
    queryId: bigint,
}

export function storeNftMintMessage<T>(src: NftMintMessage<T>, storeParams: StoreParams<T>): (builder: Builder) => void {
    return (builder: Builder) => {
        const mintOpcode = 1;

        builder.storeUint(mintOpcode, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeUint(src.itemIndex, 64);
        builder.storeCoins(src.value);
        builder.storeRef(beginCell().store(storeParams(src.itemParams)).endCell());
    };
}

export function loadNftMintMessage<T>(slice: Slice, loadParams: LoadParams<T>): NftMintMessage<T> {
    const mintOpcode = 1;
    if (slice.loadUint(32) !== mintOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const itemIndex = slice.loadUintBig(64);
    const value = slice.loadCoins();
    const itemParams = slice.loadRef();
    return {
        itemIndex,
        value,
        itemParams: loadParams(itemParams.beginParse()),
        queryId,
    };
}

export type NftMintItem<T> = {
    index: bigint,
    params: T,
    value?: bigint,
}

export type NftMintItemParams<T> = {
    index: bigint,
    value?: bigint,
} & T;

export function storeNftBatchMintItem<T>(request: NftMintItem<T>, storeParams: StoreParams<T>): (builder: Builder) => void {
    return (builder: Builder) => {
        builder.storeCoins(request.value ?? toNano('0.03'));
        builder.storeRef(beginCell().store(storeParams(request.params)).endCell());
    };
}

export function loadNftBatchMintItem<T>(slice: Slice, loadParams: LoadParams<T>): NftMintItem<T> {
    const itemIndex = slice.loadUintBig(64);
    const value = slice.loadCoins();
    const params = slice.loadRef();
    return {
        index: itemIndex,
        value,
        params: loadParams(params.beginParse()),
    };
}

export function createNftMintItemValue<T>(
    storeParams?: (params: T) => (builder: Builder) => void,
    loadParams?: (slice: Slice) => T
): DictionaryValue<NftMintItem<T>> {
    return {
        serialize(src: NftMintItem<T>, builder: Builder) {
            if (!storeParams) {
                throw new Error('storeParams is not defined');
            }

            builder.store(storeNftBatchMintItem(src, storeParams));
        },
        parse(src: Slice): NftMintItem<T> {
            if (!loadParams) {
                throw new Error('loadParams is not defined');
            }

            return loadNftBatchMintItem(src, loadParams);
        },
    };
}

export type NftBatchMintMessage<T> = {
    queryId?: bigint,
    requests: NftMintItem<T>[],
}

export function storeNftBatchMintMessage<T>(src: NftBatchMintMessage<T>, storeParams: StoreParams<T>): (builder: Builder) => void {
    return (builder: Builder) => {
        const mintOpcode = 2;

        const dict: Dictionary<bigint, NftMintItem<T>> = Dictionary.empty(Dictionary.Keys.BigUint(64), createNftMintItemValue(storeParams));
        for (const r of src.requests) {
            if (dict.has(r.index)) {
                throw new Error('Duplicate items');
            }
            dict.set(r.index, r);
        }

        builder.storeUint(mintOpcode, 32);
        builder.storeUint(src.queryId ?? 0, 64);
        builder.storeRef(beginCell().storeDictDirect(dict));
    };
}

export function loadNftBatchMintMessage<T>(slice: Slice, loadParams: LoadParams<T>): NftBatchMintMessage<T> {
    const mintOpcode = 2;
    if (slice.loadUint(32) !== mintOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const requests = slice.loadDictDirect(
        Dictionary.Keys.BigUint(64),
        createNftMintItemValue(undefined, loadParams)
    );
    return {
        queryId: queryId,
        requests: requests.values(),
    };
}

export type NftChangeAdminMessage = {
    queryId?: bigint
    newAdmin: Address,
};

export function storeNftChangeAdminMessage(src: NftChangeAdminMessage): (builder: Builder) => void {
    return (builder: Builder) => {
        const changeAdminOpcode = 3;
        builder.storeUint(changeAdminOpcode, 32);
        builder.storeUint(src.queryId ?? 0, 64);
        builder.storeAddress(src.newAdmin);
    };
}

export function loadNftChangeAdminMessage(slice: Slice): NftChangeAdminMessage {
    const changeAdminOpcode = 3;
    if (slice.loadUint(32) !== changeAdminOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const newAdmin = slice.loadAddress();
    return {
        queryId,
        newAdmin,
    };
}

export type NftChangeContentMessage = {
    queryId?: bigint,
    newContent: Cell,
    newRoyaltyParams: Cell,
}

export function storeNftChangeContentMessage(src: NftChangeContentMessage): (builder: Builder) => void {
    return (builder: Builder) => {
        const changeContentOpcode = 4;
        builder.storeUint(changeContentOpcode, 32);
        builder.storeUint(src.queryId ?? 0, 64);
        builder.storeRef(src.newContent);
        builder.storeRef(src.newRoyaltyParams);
    };
}

export function loadNftChangeContentMessage(slice: Slice): NftChangeContentMessage {
    const changeContentOpcode = 4;
    if (slice.loadUint(32) !== changeContentOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const newContent = slice.loadRef();
    const newRoyaltyParams = slice.loadRef();
    return {
        queryId,
        newContent,
        newRoyaltyParams,
    };
}
