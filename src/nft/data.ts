import { Address, Cell } from '@ton/core';

export interface NftItemData {
    initialized: boolean;
    index: bigint;
    collection: Address | null;
    owner: Address | null;
    individualContent: Cell | null;
}

export interface NftCollectionData {
    nextItemIndex: bigint;
    content: Cell;
    owner: Address | null;
}

export interface NftSaleData {
    type: number;
    isComplete: boolean;
    createdAt: number;
    marketplace: Address;
    nft: Address;
    nftOwner: Address | null;
    fullPrice: bigint;
    marketplaceFeeTo: Address;
    marketplaceFee: bigint;
    royaltyTo: Address | null;
    royalty: bigint;
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
