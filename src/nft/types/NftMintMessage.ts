import {beginCell, Builder, Slice} from "@ton/core";
import {NFT_MINT_OPCODE} from "../opcodes";
import {LoadParams, StoreParams} from "./ParamsValue";

export type NftMintMessage<T> = {
    itemIndex: bigint,
    value: bigint,
    itemParams: T,
    queryId: bigint,
}

export function storeNftMintMessage<T>(src: NftMintMessage<T>, storeParams: StoreParams<T>): (builder: Builder) => void {
    return (builder: Builder) => {
        builder.storeUint(NFT_MINT_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeUint(src.itemIndex, 64);
        builder.storeCoins(src.value);
        builder.storeRef(beginCell().store(storeParams(src.itemParams)).endCell());
    };
}

export function loadNftMintMessage<T>(slice: Slice, loadParams: LoadParams<T>): NftMintMessage<T> {
    if (slice.loadUint(32) !== NFT_MINT_OPCODE) {
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
