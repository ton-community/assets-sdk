import {Address, beginCell, Sender, toNano} from "@ton/core";
import {Storage} from "./storage/storage";
import {PinataStorage, PinataStorageParams} from "./storage/pinata";
import {S3Storage, S3StorageParams} from "./storage/s3";
import {TonClientApi} from "./client/ton-client-api";
import {JettonContent, jettonContentToInternal} from "./jetton/content";
import {JettonParams} from "./jetton/data";
import {NftContent, nftContentToInternal} from "./nft/content";
import {internalOnchainContentToCell} from "./utils";
import {JettonWallet} from "./jetton/JettonWallet";
import {JettonMinter} from "./jetton/JettonMinter";
import {NftCollection} from "./nft/NftCollection";
import {NftItem} from "./nft/NftItem";
import {SbtCollection} from "./nft/SbtCollection";
import {NftSaleParams} from "./nft/data";
import {ContentResolver, DefaultContentResolver} from "./content";
import {NftSale} from "./nft/NftSale";
import { NoopStorage } from "./storage/noop";
import {NftItemParams, NftItemParamsValue, NftRoyaltyParams} from "./nft/NftCollection.data";
import {NftMintItemParams, NftMintMessage} from "./nft/NftCollectionBase.data";
import {SbtItemParams} from "./nft/SbtCollection.data";
import {SendTransferOptions} from "./common/types";

const WORKCHAIN = 0;

export class AssetsSDK {
    static create(params: {
        api: TonClientApi,
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
        public readonly api: TonClientApi,
        public readonly sender?: Sender,
        public readonly contentResolver?: ContentResolver
    ) {}

    async deployJetton(content: JettonContent, adminAddress?: Address, premintAmount?: bigint, premintOptions?: SendTransferOptions, value?: bigint, queryId?: bigint) {
        if (!this.sender) {
            throw new Error('Sender must be defined');
        }

        adminAddress ??= this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }

        const jettonMinterContract = JettonMinter.createFromConfig({
            admin: adminAddress,
            content: await this.contentToCell(jettonContentToInternal(content), content?.onchainContent ?? false),
        }, JettonMinter.code, WORKCHAIN, this.contentResolver);
        const jetton = this.api.open(jettonMinterContract);

        if (typeof premintAmount === 'bigint' && premintAmount > 0n) {
            await jetton.sendDeploy(this.sender, value);
        } else {
            await jetton.sendMint(this.sender, adminAddress, premintAmount, premintOptions, value, queryId);
        }
        return jetton;
    }

    openJetton(address: Address) {
        return this.api.open(JettonMinter.createFromAddress(address, this.contentResolver));
    }

    async deployNftCollection(content: { collectionContent: NftContent, commonContent: string, onchainContent?: boolean }, options?: {
        royaltyParams?: NftRoyaltyParams,
        adminAddress?: Address
    }, premintItems?: NftMintItemParams<NftItemParams>[], value?: bigint, queryId?: bigint) {
        if (!this.sender) {
            throw new Error('Sender must be defined');
        }

        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }

        const collection = this.api.open(NftCollection.createFromConfig({
            admin: adminAddress,
            content: beginCell()
                .storeRef(await this.contentToCell(nftContentToInternal(content.collectionContent), content?.onchainContent ?? false))
                .storeRef(beginCell().storeStringTail(content.commonContent))
                .endCell(),
            royalty: options?.royaltyParams,
        }, NftCollection.code, WORKCHAIN, this.contentResolver));

        if (typeof premintItems?.length === 'number' && premintItems.length > 0) {
            await collection.sendBatchMint(this.sender, premintItems, value, queryId);
        } else {
            await collection.sendDeploy(this.sender, value);
        }

        return collection;
    }

    openNftCollection(address: Address) {
        return this.api.open(NftCollection.createFromAddress(address, this.contentResolver));
    }

    async deploySbtCollection(content: { collectionContent: NftContent, commonContent: string, onchainContent?: boolean }, adminAddress?: Address, premintItems?: NftMintItemParams<SbtItemParams>[], value?: bigint, queryId?: bigint) {
        if (!this.sender) {
            throw new Error('Sender must be defined');
        }

        adminAddress ??= this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }

        const collection = this.api.open(SbtCollection.createFromConfig({
            admin: adminAddress,
            content: beginCell()
                .storeRef(await this.contentToCell(nftContentToInternal(content.collectionContent), content?.onchainContent ?? false))
                .storeRef(beginCell().storeStringTail(content.commonContent))
                .endCell(),
        }, SbtCollection.code, WORKCHAIN, this.contentResolver));

        if (typeof premintItems?.length === 'number' && premintItems.length > 0) {
            await collection.sendBatchMint(this.sender, premintItems, value, queryId);
        } else {
            await collection.sendDeploy(this.sender, value);
        }

        return collection;
    }

    openSbtCollection(address: Address) {
        return this.api.open(SbtCollection.createFromAddress(address, this.contentResolver));
    }

    openJettonWallet(address: Address) {
        return this.api.open(new JettonWallet(address));
    }

    openNftItem(address: Address) {
        return this.api.open(new NftItem(address, undefined, this.contentResolver));
    }

    async deployNftSale(params: NftSaleParams) {
        if (!this.sender) {
            throw new Error('Sender must be defined');
        }

        const marketplaceAddress = params.marketplace ?? this.sender?.address
        if (marketplaceAddress === undefined) {
            throw new Error('Marketplace address must be defined in options or be available in Sender');
        }
        const sale = this.api.open(NftSale.createFromConfig({
            createdAt: params.createdAt ?? Math.floor(Date.now() / 1000),
            marketplace: params.marketplace ?? null,
            nft: params.nft,
            fullPrice: params.fullPrice,
            marketplaceFeeTo: params.marketplaceFeeTo ?? null,
            marketplaceFee: params.marketplaceFee ?? 0n,
            royaltyTo: params.royaltyTo ?? null,
            royalty: params.royalty ?? 0n,
            canDeployByExternal: params.canDeployByExternal ?? true,
        }));
        await sale.sendTopup(this.sender, params.value, params.queryId);
        return sale;
    }

    openNftSale(address: Address) {
        return this.api.open(NftSale.createFromAddress(address));
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
