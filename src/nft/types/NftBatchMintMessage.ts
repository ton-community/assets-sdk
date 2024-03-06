import {beginCell, Builder, Dictionary, DictionaryValue, Slice, toNano} from "@ton/core";
import {NFT_BATCH_MINT_OPCODE} from "../opcodes";
import {LoadParams, StoreParams} from "../../common/types/ParamsValue";

export type NftBatchMintMessage<T> = {
    queryId: bigint,
    requests: NftMintItem<T>[],
}

export function storeNftBatchMintMessage<T>(src: NftBatchMintMessage<T>, storeParams: StoreParams<T>): (builder: Builder) => void {
    return (builder: Builder) => {
        const dict: Dictionary<bigint, NftMintItem<T>> = Dictionary.empty(Dictionary.Keys.BigUint(64), createNftMintItemValue(storeParams));
        for (const r of src.requests) {
            if (dict.has(r.index)) {
                throw new Error('Duplicate items');
            }
            dict.set(r.index, r);
        }

        builder.storeUint(NFT_BATCH_MINT_OPCODE, 32);
        builder.storeUint(src.queryId ?? 0, 64);
        builder.storeRef(beginCell().storeDictDirect(dict));
    };
}

export function loadNftBatchMintMessage<T>(slice: Slice, loadParams: LoadParams<T>): NftBatchMintMessage<T> {
    if (slice.loadUint(32) !== NFT_BATCH_MINT_OPCODE) {
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
