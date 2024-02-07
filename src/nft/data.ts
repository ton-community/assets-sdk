import {Address, Cell} from "@ton/core";

export type NftItemParams = {
    owner: Address,
    individualContent: Cell | string,
};

export type SbtItemParams = NftItemParams & {
    authority?: Address,
};

export type SingleMintRequest<T> = {
    itemIndex: bigint,
    value?: bigint,
    itemParams: Cell | T,
};

// export type MintRequest<T> = {
//     queryId?: bigint,
//     requestValue?: bigint,
// } & SingleMintRequest<T>;

// export type NftMintRequest = MintRequest<NftItemParams>;
//
// export type SbtMintRequest = MintRequest<SbtItemParams>;

export type NftTransferRequest = {
    queryId?: bigint,
    to: Address,
    responseDestination?: Address,
    customPayload?: Cell,
    forwardAmount?: bigint,
    forwardPayload?: Cell,
    value?: bigint,
};

export interface NftTransferBody {
    queryId: bigint,
    newOwner: Address,
    responseDestination: Address | null,
    customPayload: Cell | null,
    forwardAmount: bigint,
    forwardPayload: Cell,
}

export interface NftTransfer extends NftTransferBody  {
    success: boolean,
    value: bigint,
}

export interface NftItemData {
    initialized: boolean,
    index: bigint,
    collection: Address | null,
    owner: Address | null,
    individualContent: Cell | null,
}

export interface NftCollectionData {
    nextItemIndex: bigint,
    content: Cell,
    owner: Address | null,
}

export interface NftSaleData {
    type: number,
    isComplete: boolean,
    createdAt: number,
    marketplace: Address,
    nft: Address,
    nftOwner: Address | null,
    fullPrice: bigint,
    marketplaceFeeTo: Address,
    marketplaceFee: bigint,
    royaltyTo: Address | null,
    royalty: bigint,
}

export interface NftSaleParams {
    createdAt?: number;
    marketplace: Address;
    nft: Address;
    fullPrice: bigint;
    marketplaceFeeTo: Address;
    marketplaceFee: bigint;
    royaltyTo?: Address | null;
    royalty?: bigint;
    canDeployByExternal?: boolean;
    value?: bigint;
    queryId?: bigint;
}
