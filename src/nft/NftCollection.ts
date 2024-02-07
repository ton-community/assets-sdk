import {Address, beginCell, Builder, Cell, contractAddress, ContractProvider, Sender, Slice} from "@ton/core";
import {NftCollectionBase} from "./NftCollectionBase";
import {NftItem} from "./NftItem";
import {ContentResolver} from "../content";

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

export type NftItemParams<T> = {
    owner: Address,
    individualContent: T,
};

export type NftItemStringParams = NftItemParams<string>;

export type NftItemCellParams = NftItemParams<Cell>;

export function storeNftItemStringParams(src: NftItemStringParams) {
    return (builder: Builder) => {
        builder.storeAddress(src.owner);
        builder.storeRef(beginCell().storeStringTail(src.individualContent).endCell());
    };
}

export function loadNftItemStringParams(slice: Slice): NftItemStringParams {
    const owner = slice.loadAddress();
    const content = slice.loadRef().beginParse().loadStringRefTail();
    return {owner, individualContent: content};
}

export function storeNftItemCellParams(src: NftItemCellParams) {
    return (builder: Builder) => {
        builder.storeAddress(src.owner);
        builder.storeRef(src.individualContent);
    };
}

export function loadNftItemCellParams(slice: Slice): NftItemCellParams {
    return {
        owner: slice.loadAddress(),
        individualContent: slice.loadRef(),
    };
}

export class NftCollection<T = string> extends NftCollectionBase<NftItemParams<T>> {
    static create<T = string>(params: {
        admin: Address,
        content: Cell,
        royalty?: NftRoyaltyParams,
        storeNftItemParams?: (params: NftItemParams<T>) => (builder: Builder) => void,
        loadNftItemParams?: (slice: Slice) => NftItemParams<T>,
    }, sender?: Sender, contentResolver?: ContentResolver) {
        const data = beginCell().store(storeNftCollectionData({
            admin: params.admin,
            content: params.content,
            itemCode: NftItem.nftCode,
            royalty: {
                numerator: params.royalty?.numerator ?? 0n,
                denominator: params.royalty?.denominator ?? 1n,
                recipient: params.royalty?.recipient ?? params.admin,
            },
        })).endCell();
        const init = { data, code: NftCollection.code };
        const storeNftItemParams = params.storeNftItemParams ?? storeNftItemStringParams as (params: NftItemParams<T>) => (builder: Builder) => void;
        const loadNftItemParams = params.loadNftItemParams ?? loadNftItemStringParams as (slice: Slice) => NftItemParams<T>;
        return new NftCollection<T>(contractAddress(0, init), sender, init, contentResolver, storeNftItemParams, loadNftItemParams);
    }

    static open<T = string>(
        address: Address,
        sender?: Sender,
        contentResolver?: ContentResolver,
        storeNftItemParams?: (params: NftItemParams<T>) => (builder: Builder) => void,
        loadNftItemParams?: (slice: Slice) => NftItemParams<T>,
    ) {
        return new NftCollection<T>(address, sender, undefined, contentResolver, storeNftItemParams, loadNftItemParams);
    }

    async getRoyaltyParams(provider: ContractProvider): Promise<NftRoyaltyParams> {
        const {stack} = await provider.get('royalty_params', []);
        return {
            numerator: stack.readBigNumber(),
            denominator: stack.readBigNumber(),
            recipient: stack.readAddress(),
        };
    }
}
