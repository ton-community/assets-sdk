import { Address, Sender, toNano, beginCell, Contract } from "@ton/core";
import { PinataStorage, S3Storage, Storage } from "./storage";
import { API } from "./api";
import { ExtendedTonClient4 } from "./ExtendedTonClient4";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { JettonContent, jettonContentToInternal } from "./jetton/content";
import { Jetton } from "./jetton/contracts";
import { JettonMintRequest } from "./jetton/data";
import { NftContent, nftContentToInternal } from "./nft/content";
import { NftCollection, NftMintRequest, SbtCollection, SbtMintRequest } from "./nft/contracts";
import { ExtendedContractProvider } from "./ExtendedContractProvider";
import { internalOnchainContentToCell } from "./utils";

interface PinataStorageParams {
    pinataApiKey: string
    pinataSecretKey: string
}

interface S3StorageParams {
    s3AccessKeyId: string
    s3SecretAccessKey: string
    s3Bucket: string
}

export class GameFiSDK {
    constructor(public readonly storage: Storage, public readonly api: API, public readonly sender?: Sender) {}

    static async create(params: {
        storage: PinataStorageParams | S3StorageParams | Storage,
        api: 'mainnet' | 'testnet' | API,
        wallet?: { wallet: Contract, senderCreator: (provider: ExtendedContractProvider) => Sender } | Sender,
    }) {
        let storage: Storage;
        if ('pinataApiKey' in params.storage) {
            storage = new PinataStorage(params.storage.pinataApiKey, params.storage.pinataSecretKey);
        } else if ('s3AccessKeyId' in params.storage) {
            storage = new S3Storage(params.storage.s3AccessKeyId, params.storage.s3SecretAccessKey, params.storage.s3Bucket);
        } else {
            storage = params.storage;
        }

        let api: API;
        if (params.api === 'mainnet' || params.api === 'testnet') {
            const tc4 = new ExtendedTonClient4({ endpoint: await getHttpV4Endpoint({ network: params.api }), timeout: 15000 });
            api = { open: (contract) => tc4.openExtended(contract), provider: (addr, init) => tc4.provider(addr, init) };
        } else {
            api = params.api;
        }

        let sender: Sender | undefined = undefined;
        if (params.wallet !== undefined) {
            if ('senderCreator' in params.wallet) {
                sender = params.wallet.senderCreator(api.provider(params.wallet.wallet.address, params.wallet.wallet.init));
            } else {
                sender = params.wallet;
            }
        }

        return new GameFiSDK(storage, api, sender);
    }

    async createJetton(content: JettonContent, options?: {
        onchainContent?: boolean,
        adminAddress?: Address,
        premint?: Exclude<JettonMintRequest, 'requestValue'>,
        value?: bigint,
    }) {
        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }
        const jetton = this.api.open(Jetton.create({
            admin: adminAddress,
            content: await this.contentToCell(jettonContentToInternal(content), options?.onchainContent ?? false),
        }, this.sender));
        const value = options?.value ?? toNano('0.05');
        if (options?.premint === undefined) {
            await jetton.sendDeploy(value);
        } else {
            await jetton.sendMint({
                ...options.premint,
                requestValue: value,
            });
        }
        return jetton;
    }

    openJetton(address: Address) {
        return this.api.open(Jetton.open(address, this.sender));
    }

    async createNftCollection(content: { collectionContent: NftContent, commonContent: string }, options?: {
        onchainContent?: boolean,
        adminAddress?: Address,
        premint?: Exclude<NftMintRequest, 'requestValue'>,
        value?: bigint,
    }) {
        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }
        const collection = this.api.open(NftCollection.create({
            admin: adminAddress,
            content: beginCell()
            .storeRef(await this.contentToCell(nftContentToInternal(content.collectionContent), options?.onchainContent ?? false))
            .storeRef(beginCell().storeStringTail(content.commonContent))
            .endCell(),
        }, this.sender));
        const value = options?.value ?? toNano('0.05');
        if (options?.premint === undefined) {
            await collection.sendDeploy(value);
        } else {
            await collection.sendMint({
                ...options.premint,
                requestValue: value,
            });
        }
        return collection;
    }

    openNftCollection(address: Address) {
        return this.api.open(NftCollection.open(address, this.sender));
    }

    async createSbtCollection(content: { collectionContent: NftContent, commonContent: string }, options?: {
        onchainContent?: boolean,
        adminAddress?: Address,
        premint?: Exclude<SbtMintRequest, 'requestValue'>,
        value?: bigint,
    }) {
        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }
        const collection = this.api.open(SbtCollection.create({
            admin: adminAddress,
            content: beginCell()
                .storeRef(await this.contentToCell(nftContentToInternal(content.collectionContent), options?.onchainContent ?? false))
                .storeRef(beginCell().storeStringTail(content.commonContent))
                .endCell(),
        }, this.sender));
        const value = options?.value ?? toNano('0.05');
        if (options?.premint === undefined) {
            await collection.sendDeploy(value);
        } else {
            await collection.sendMint({
                ...options.premint,
                requestValue: value,
            });
        }
        return collection;
    }

    openSbtCollection(address: Address) {
        return this.api.open(SbtCollection.open(address, this.sender));
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
