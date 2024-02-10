import {Address, beginCell, Sender, toNano} from "@ton/core";
import {Storage} from "./storage/storage";
import {PinataStorage, PinataStorageParams} from "./storage/pinata";
import {S3Storage, S3StorageParams} from "./storage/s3";
import {API} from "./client/api";
import {JettonContent, jettonContentToInternal} from "./jetton/content";
import {JettonParams} from "./jetton/data";
import {NftContent, nftContentToInternal} from "./nft/content";
import {internalOnchainContentToCell} from "./utils";
import {JettonWallet} from "./jetton/JettonWallet";
import {JettonMinter} from "./jetton/JettonMinter";
import {NftCollection, NftItemParams, NftRoyaltyParams} from "./nft/NftCollection";
import {NftItem} from "./nft/NftItem";
import {SbtCollection} from "./nft/SbtCollection";
import {NftSaleParams} from "./nft/data";
import {ContentResolver, DefaultContentResolver} from "./content";
import {NftSale} from "./nft/NftSale";
import {NftMintMessage} from "./nft/NftCollectionBase";
import { NoopStorage } from "./storage/noop";

export class AssetsSDK {
    static create(params: {
        api: API,
        storage?: PinataStorageParams | S3StorageParams | Storage,
        sender?: Sender,
        contentResolver?: ContentResolver,
    }) {
        let { api, storage, sender: sender, contentResolver } = params;

        if (!storage) {
            storage = new NoopStorage();
        } else if ('pinataApiKey' in storage) {
            storage = PinataStorage.create(storage);
        } else if ('s3AccessKeyId' in storage) {
            storage = S3Storage.create(storage);
        }

        contentResolver ??= new DefaultContentResolver();

        return new AssetsSDK(storage, api, sender, contentResolver);
    }

    constructor(
        public readonly storage: Storage,
        public readonly api: API,
        public readonly sender?: Sender,
        public readonly contentResolver?: ContentResolver
    ) {}

    async deployJetton(content: JettonContent, options?: JettonParams) {
        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }
        const jetton = this.api.openExtended(JettonMinter.create({
            admin: adminAddress,
            content: await this.contentToCell(jettonContentToInternal(content), options?.onchainContent ?? false),
        }, this.sender, this.contentResolver));
        const value = options?.value ?? toNano('0.05');
        if (options?.premint === undefined) {
            await jetton.sendDeploy({value});
        } else {
            await jetton.sendMint(options.premint, {value: value});
        }
        return jetton;
    }

    openJetton(address: Address) {
        return this.api.openExtended(JettonMinter.open(address, this.sender, this.contentResolver));
    }

    async deployNftCollection(content: { collectionContent: NftContent, commonContent: string }, options?: {
        royaltyParams?: NftRoyaltyParams,
        onchainContent?: boolean,
        adminAddress?: Address,
        premint?: NftMintMessage<NftItemParams<string>>,
        value?: bigint,
    }) {
        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }
        const collection = this.api.openExtended(NftCollection.create({
            admin: adminAddress,
            content: beginCell()
                .storeRef(await this.contentToCell(nftContentToInternal(content.collectionContent), options?.onchainContent ?? false))
                .storeRef(beginCell().storeStringTail(content.commonContent))
                .endCell(),
            royalty: options?.royaltyParams,
        }, this.sender, this.contentResolver));
        const value = options?.value ?? toNano('0.05');
        if (options?.premint === undefined) {
            await collection.sendDeploy({value: value});
        } else {
            await collection.sendMint(options.premint, {value: value});
        }
        return collection;
    }

    openNftCollection(address: Address) {
        return this.api.openExtended(NftCollection.open(address, this.sender, this.contentResolver));
    }

    async deploySbtCollection(content: { collectionContent: NftContent, commonContent: string }, options?: {
        onchainContent?: boolean,
        adminAddress?: Address,
        premint?: NftMintMessage<NftItemParams<string>>,
        value?: bigint,
    }) {
        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }
        const collection = this.api.openExtended(SbtCollection.create({
            admin: adminAddress,
            content: beginCell()
                .storeRef(await this.contentToCell(nftContentToInternal(content.collectionContent), options?.onchainContent ?? false))
                .storeRef(beginCell().storeStringTail(content.commonContent))
                .endCell(),
        }, this.sender, this.contentResolver));
        const value = options?.value ?? toNano('0.05');
        if (options?.premint === undefined) {
            await collection.sendDeploy({ value: value });
        } else {
            await collection.sendMint(options.premint, {value: value});
        }
        return collection;
    }

    openSbtCollection(address: Address) {
        return this.api.openExtended(SbtCollection.open(address, this.sender, this.contentResolver));
    }

    openJettonWallet(address: Address) {
        return this.api.openExtended(new JettonWallet(address, this.sender));
    }

    openNftItem(address: Address) {
        return this.api.openExtended(new NftItem(address, this.sender, this.contentResolver));
    }

    async deployNftSale(params: NftSaleParams) {
        const marketplaceAddress = params.marketplace ?? this.sender?.address
        if (marketplaceAddress === undefined) {
            throw new Error('Marketplace address must be defined in options or be available in Sender');
        }
        const sale = this.api.openExtended(NftSale.create({
            createdAt: params.createdAt ?? Math.floor(Date.now() / 1000),
            marketplace: params.marketplace ?? null,
            nft: params.nft,
            fullPrice: params.fullPrice,
            marketplaceFeeTo: params.marketplaceFeeTo ?? null,
            marketplaceFee: params.marketplaceFee ?? 0n,
            royaltyTo: params.royaltyTo ?? null,
            royalty: params.royalty ?? 0n,
            canDeployByExternal: params.canDeployByExternal ?? true,
        }, this.sender));
        const value = params.value ?? toNano('0.05');
        await sale.sendTopup(value, params.queryId);
        return sale;
    }

    openNftSale(address: Address) {
        return this.api.openExtended(NftSale.open(address, this.sender));
    }

    private async internalOffchainContentToCell(internal: Record<string, string | number | undefined>) {
        const contentUrl = await this.storage.uploadFile(Buffer.from(JSON.stringify(internal), 'utf-8'));
        return beginCell()
            .storeUint(0x01, 8)
            .storeStringTail(contentUrl)
            .endCell();
    }

    private async contentToCell(internal: Record<string, string | number | undefined>, onchain: boolean) {
        return onchain ? internalOnchainContentToCell(internal) : await this.internalOffchainContentToCell(internal);
    }
}
