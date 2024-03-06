"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameFiSDK = void 0;
const core_1 = require("@ton/core");
const storage_1 = require("./storage");
const ExtendedTonClient4_1 = require("./ExtendedTonClient4");
const ton_access_1 = require("@orbs-network/ton-access");
const content_1 = require("./jetton/content");
const content_2 = require("./nft/content");
const utils_1 = require("./utils");
const JettonWallet_1 = require("./jetton/JettonWallet");
const Jetton_1 = require("./jetton/Jetton");
const NftCollection_1 = require("./nft/NftCollection");
const NftItem_1 = require("./nft/NftItem");
const SbtCollection_1 = require("./nft/SbtCollection");
const content_3 = require("./content");
const NftSale_1 = require("./nft/NftSale");
class GameFiSDK {
    constructor(storage, api, sender, contentResolver) {
        this.storage = storage;
        this.api = api;
        this.sender = sender;
        this.contentResolver = contentResolver;
    }
    static async create(params) {
        let storage;
        if ('pinataApiKey' in params.storage) {
            storage = new storage_1.PinataStorage(params.storage.pinataApiKey, params.storage.pinataSecretKey);
        }
        else if ('s3AccessKeyId' in params.storage) {
            storage = new storage_1.S3Storage(params.storage.s3AccessKeyId, params.storage.s3SecretAccessKey, params.storage.s3Bucket);
        }
        else {
            storage = params.storage;
        }
        let api;
        if (params.api === 'mainnet' || params.api === 'testnet') {
            const tc4 = new ExtendedTonClient4_1.ExtendedTonClient4({ endpoint: await (0, ton_access_1.getHttpV4Endpoint)({ network: params.api }), timeout: 15000 });
            api = { open: (contract) => tc4.openExtended(contract), provider: (addr, init) => tc4.provider(addr, init) };
        }
        else {
            api = params.api;
        }
        let sender = undefined;
        if (params.wallet !== undefined) {
            if ('senderCreator' in params.wallet) {
                sender = params.wallet.senderCreator(api.provider(params.wallet.wallet.address, params.wallet.wallet.init));
            }
            else {
                sender = params.wallet;
            }
        }
        return new GameFiSDK(storage, api, sender, params.contentResolver ?? new content_3.DefaultContentResolver());
    }
    async createJetton(content, options) {
        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }
        const jetton = this.api.open(Jetton_1.Jetton.create({
            admin: adminAddress,
            content: await this.contentToCell((0, content_1.jettonContentToInternal)(content), options?.onchainContent ?? false),
        }, this.sender, this.contentResolver));
        const value = options?.value ?? (0, core_1.toNano)('0.05');
        if (options?.premint === undefined) {
            await jetton.sendDeploy(value);
        }
        else {
            await jetton.sendMint({
                ...options.premint,
                requestValue: value,
            });
        }
        return jetton;
    }
    openJetton(address) {
        return this.api.open(Jetton_1.Jetton.open(address, this.sender, this.contentResolver));
    }
    async createNftCollection(content, options) {
        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }
        const collection = this.api.open(NftCollection_1.NftCollection.create({
            admin: adminAddress,
            content: (0, core_1.beginCell)()
                .storeRef(await this.contentToCell((0, content_2.nftContentToInternal)(content.collectionContent), options?.onchainContent ?? false))
                .storeRef((0, core_1.beginCell)().storeStringTail(content.commonContent))
                .endCell(),
        }, this.sender, this.contentResolver));
        const value = options?.value ?? (0, core_1.toNano)('0.05');
        if (options?.premint === undefined) {
            await collection.sendDeploy(value);
        }
        else {
            await collection.sendMint({
                ...options.premint,
                requestValue: value,
            });
        }
        return collection;
    }
    openNftCollection(address) {
        return this.api.open(NftCollection_1.NftCollection.open(address, this.sender, this.contentResolver));
    }
    async createSbtCollection(content, options) {
        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }
        const collection = this.api.open(SbtCollection_1.SbtCollection.create({
            admin: adminAddress,
            content: (0, core_1.beginCell)()
                .storeRef(await this.contentToCell((0, content_2.nftContentToInternal)(content.collectionContent), options?.onchainContent ?? false))
                .storeRef((0, core_1.beginCell)().storeStringTail(content.commonContent))
                .endCell(),
        }, this.sender, this.contentResolver));
        const value = options?.value ?? (0, core_1.toNano)('0.05');
        if (options?.premint === undefined) {
            await collection.sendDeploy(value);
        }
        else {
            await collection.sendMint({
                ...options.premint,
                requestValue: value,
            });
        }
        return collection;
    }
    openSbtCollection(address) {
        return this.api.open(SbtCollection_1.SbtCollection.open(address, this.sender, this.contentResolver));
    }
    openJettonWallet(address) {
        return this.api.open(new JettonWallet_1.JettonWallet(address, this.sender));
    }
    openNftItem(address) {
        return this.api.open(new NftItem_1.NftItem(address, this.sender, this.contentResolver));
    }
    async createNftSale(params) {
        const marketplaceAddress = params.marketplace ?? this.sender?.address;
        if (marketplaceAddress === undefined) {
            throw new Error('Marketplace address must be defined in options or be available in Sender');
        }
        const sale = this.api.open(NftSale_1.NftSale.create({
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
        const value = params.value ?? (0, core_1.toNano)('0.05');
        await sale.sendTopup(value, params.queryId);
        return sale;
    }
    openNftSale(address) {
        return this.api.open(NftSale_1.NftSale.open(address, this.sender));
    }
    async internalOffchainContentToCell(internal) {
        const contentUrl = await this.storage.uploadFile(Buffer.from(JSON.stringify(internal), 'utf-8'));
        return (0, core_1.beginCell)()
            .storeUint(0x01, 8)
            .storeStringTail(contentUrl)
            .endCell();
    }
    async contentToCell(internal, onchain) {
        return onchain ? (0, utils_1.internalOnchainContentToCell)(internal) : await this.internalOffchainContentToCell(internal);
    }
}
exports.GameFiSDK = GameFiSDK;
