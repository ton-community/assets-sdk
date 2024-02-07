import {Address, beginCell, Builder, Cell, contractAddress, Sender, Slice} from "@ton/core";
import {NftCollectionBase} from "./NftCollectionBase";
import {NftItem} from "./NftItem";
import {ContentResolver} from "../content";
import {NftRoyaltyParams, storeNftCollectionData} from './NftCollection';

export type SbtItemParams<T> = {
    owner: Address,
    individualContent: T,
    authority?: Address,
};

export type SbtItemStringParams = SbtItemParams<string>;

export type SbtItemCellParams = SbtItemParams<Cell>;

export function storeSbtItemStringParams(src: SbtItemStringParams) {
    return (builder: Builder) => {
        builder.storeAddress(src.owner);
        builder.storeRef(beginCell().storeStringTail(src.individualContent).endCell());
        builder.storeAddress(src.authority);
    };
}

export function loadSbtItemStringParams(slice: Slice): SbtItemStringParams {
    const owner = slice.loadAddress();
    const content = slice.loadRef().beginParse().loadStringRefTail();
    const authority = slice.loadAddress();

    return {owner, individualContent: content, authority};
}

export function storeSbtItemCellParams(src: SbtItemCellParams) {
    return (builder: Builder) => {
        builder.storeAddress(src.owner);
        builder.storeRef(src.individualContent);
        builder.storeAddress(src.authority);
    };
}

export function loadSbtItemCellParams(slice: Slice): SbtItemCellParams {
    const owner = slice.loadAddress();
    const content = slice.loadRef();
    const authority = slice.loadAddress();

    return {owner, individualContent: content, authority};
}

export class SbtCollection<T = string> extends NftCollectionBase<SbtItemParams<T>> {
    static create<T = string>(params: {
        admin: Address,
        content: Cell,
        royalty?: NftRoyaltyParams,
        storeSbtItemParams?: (params: SbtItemParams<T>) => (builder: Builder) => void,
        loadSbtItemParams?: (slice: Slice) => SbtItemParams<T>,
    }, sender?: Sender, contentResolver?: ContentResolver) {
        const data = beginCell().store(storeNftCollectionData({
            admin: params.admin,
            content: params.content,
            itemCode: NftItem.sbtCode,
            royalty: {
                numerator: params.royalty?.numerator ?? 0n,
                denominator: params.royalty?.denominator ?? 1n,
                recipient: params.royalty?.recipient ?? params.admin,
            },
        })).endCell();
        const init = {data, code: SbtCollection.code};
        const storeSbtItemParams = params.storeSbtItemParams ?? storeSbtItemStringParams as (params: SbtItemParams<T>) => (builder: Builder) => void;
        const loadSbtItemParams = params.loadSbtItemParams ?? loadSbtItemStringParams as (slice: Slice) => SbtItemParams<T>;
        return new SbtCollection(contractAddress(0, init), sender, init, contentResolver, storeSbtItemParams, loadSbtItemParams);
    }

    static open(address: Address, sender?: Sender, contentResolver?: ContentResolver) {
        return new SbtCollection(address, sender, undefined, contentResolver);
    }
}
