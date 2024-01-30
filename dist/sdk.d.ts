import { Address, Sender, Contract } from "@ton/core";
import { Storage } from "./storage";
import { API } from "./api";
import { JettonContent } from "./jetton/content";
import { JettonMintRequest } from "./jetton/data";
import { NftContent } from "./nft/content";
import { ExtendedContractProvider } from "./ExtendedContractProvider";
import { JettonWallet } from "./jetton/JettonWallet";
import { Jetton } from "./jetton/Jetton";
import { NftCollection } from "./nft/NftCollection";
import { NftItem } from "./nft/NftItem";
import { SbtCollection } from "./nft/SbtCollection";
import { NftMintRequest, SbtMintRequest } from "./nft/data";
import { ContentResolver } from "./content";
import { NftSale } from "./nft/NftSale";
export interface PinataStorageParams {
    pinataApiKey: string;
    pinataSecretKey: string;
}
export interface S3StorageParams {
    s3AccessKeyId: string;
    s3SecretAccessKey: string;
    s3Bucket: string;
}
export declare class GameFiSDK {
    readonly storage: Storage;
    readonly api: API;
    readonly sender?: Sender | undefined;
    readonly contentResolver?: ContentResolver | undefined;
    constructor(storage: Storage, api: API, sender?: Sender | undefined, contentResolver?: ContentResolver | undefined);
    static create(params: {
        storage: PinataStorageParams | S3StorageParams | Storage;
        api: 'mainnet' | 'testnet' | API;
        wallet?: {
            wallet: Contract;
            senderCreator: (provider: ExtendedContractProvider) => Sender;
        } | Sender;
        contentResolver?: ContentResolver;
    }): Promise<GameFiSDK>;
    createJetton(content: JettonContent, options?: {
        onchainContent?: boolean;
        adminAddress?: Address;
        premint?: Exclude<JettonMintRequest, 'requestValue'>;
        value?: bigint;
    }): Promise<import("./api").ExtendedOpenedContract<Jetton>>;
    openJetton(address: Address): import("./api").ExtendedOpenedContract<Jetton>;
    createNftCollection(content: {
        collectionContent: NftContent;
        commonContent: string;
    }, options?: {
        onchainContent?: boolean;
        adminAddress?: Address;
        premint?: Exclude<NftMintRequest, 'requestValue'>;
        value?: bigint;
    }): Promise<import("./api").ExtendedOpenedContract<NftCollection>>;
    openNftCollection(address: Address): import("./api").ExtendedOpenedContract<NftCollection>;
    createSbtCollection(content: {
        collectionContent: NftContent;
        commonContent: string;
    }, options?: {
        onchainContent?: boolean;
        adminAddress?: Address;
        premint?: Exclude<SbtMintRequest, 'requestValue'>;
        value?: bigint;
    }): Promise<import("./api").ExtendedOpenedContract<SbtCollection>>;
    openSbtCollection(address: Address): import("./api").ExtendedOpenedContract<SbtCollection>;
    openJettonWallet(address: Address): import("./api").ExtendedOpenedContract<JettonWallet>;
    openNftItem(address: Address): import("./api").ExtendedOpenedContract<NftItem>;
    createNftSale(params: {
        createdAt?: number;
        marketplace?: Address | null;
        nft: Address;
        fullPrice: bigint;
        marketplaceFeeTo?: Address | null;
        marketplaceFee?: bigint;
        royaltyTo?: Address | null;
        royalty?: bigint;
        canDeployByExternal?: boolean;
        value?: bigint;
        queryId?: bigint;
    }): Promise<import("./api").ExtendedOpenedContract<NftSale>>;
    openNftSale(address: Address): import("./api").ExtendedOpenedContract<NftSale>;
    private internalOffchainContentToCell;
    private contentToCell;
}
