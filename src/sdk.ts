import { Address, beginCell, Sender } from '@ton/core';

import { Storage } from './storage/storage';
import { PinataStorage, PinataStorageParams } from './storage/pinata';
import { S3Storage, S3StorageParams } from './storage/s3';
import { TonClientApi } from './client/ton-client-api';
import { JettonContent, jettonContentToInternal } from './jetton/content';
import { NftContent, nftContentToInternal } from './nft/content';
import { internalOnchainContentToCell } from './utils';
import { JettonWallet } from './jetton/JettonWallet';
import { JettonMinter } from './jetton/JettonMinter';
import { NftCollection } from './nft/NftCollection';
import { NftItem } from './nft/NftItem';
import { SbtCollection } from './nft/SbtCollection';
import { NftSaleParams } from './nft/data';
import { ContentResolver, DefaultContentResolver } from './content';
import { NftSale } from './nft/NftSale';
import { NoopStorage } from './storage/noop';
import { SendTransferOptions } from './common/types';
import { NftRoyaltyParams } from './nft/types/NftRoyaltyParams';
import { NftMintItemParams } from './nft/types/NftBatchMintMessage';
import { SbtItemParams } from './nft/types/SbtItemParams';
import { NftItemParams } from './nft/types/NftItemParams';
import { retry } from './cli/common';

const WORKCHAIN = 0;

type DeployJettonOptions = {
    onchainContent?: boolean;
    adminAddress?: Address;
    premintAmount?: bigint;
    premintOptions?: SendTransferOptions;
    value?: bigint;
    queryId?: bigint;
};

export class AssetsSDK {
    constructor(
        public readonly storage: Storage,
        public readonly api: TonClientApi,
        public readonly sender?: Sender,
        public readonly contentResolver?: ContentResolver,
    ) {}

    static create(params: {
        api: TonClientApi;
        storage?: PinataStorageParams | S3StorageParams | Storage;
        sender?: Sender;
        contentResolver?: ContentResolver;
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

    async deployJetton(content: JettonContent, options?: DeployJettonOptions) {
        if (!this.sender) {
            throw new Error('Sender must be defined');
        }

        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }

        const jettonMinterContract = JettonMinter.createFromConfig(
            {
                admin: adminAddress,
                content: await this.contentToCell(jettonContentToInternal(content), options?.onchainContent ?? false),
            },
            JettonMinter.code,
            WORKCHAIN,
            this.contentResolver,
        );
        const jetton = this.api.open(jettonMinterContract);

        const premintAmount = options?.premintAmount;

        if (typeof premintAmount === 'bigint' && premintAmount > 0n) {
            await jetton.sendMint(this.sender, adminAddress, premintAmount, {
                ...options?.premintOptions,
                value: options?.value,
                queryId: options?.queryId,
            });
        } else {
            await jetton.sendDeploy(this.sender, options?.value);
        }
        return jetton;
    }

    openJetton(address: Address) {
        return this.api.open(JettonMinter.createFromAddress(address, this.contentResolver));
    }

    async deployNftCollection(
        content: { collectionContent: NftContent; commonContent: string },
        options?: {
            royaltyParams?: NftRoyaltyParams;
            adminAddress?: Address;
            onchainContent?: boolean;
            premintItems?: NftMintItemParams<NftItemParams>[];
            value?: bigint;
            queryId?: bigint;
        },
    ) {
        if (!this.sender) {
            throw new Error('Sender must be defined');
        }

        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }

        const collection = this.api.open(
            NftCollection.createFromConfig(
                {
                    admin: adminAddress,
                    content: beginCell()
                        .storeRef(
                            await this.contentToCell(
                                nftContentToInternal(content.collectionContent),
                                options?.onchainContent ?? false,
                            ),
                        )
                        .storeRef(beginCell().storeStringTail(content.commonContent))
                        .endCell(),
                    royalty: options?.royaltyParams,
                },
                NftCollection.code,
                WORKCHAIN,
                this.contentResolver,
            ),
        );

        if (typeof options?.premintItems?.length === 'number' && options?.premintItems.length > 0) {
            await collection.sendBatchMint(this.sender, options?.premintItems, {
                value: options?.value,
                queryId: options?.queryId,
            });
        } else {
            await collection.sendDeploy(this.sender, options?.value);
        }

        return collection;
    }

    openNftCollection(address: Address) {
        return this.api.open(NftCollection.createFromAddress(address, this.contentResolver));
    }

    async deploySbtCollection(
        content: {
            collectionContent: NftContent;
            commonContent: string;
            onchainContent?: boolean;
        },
        options?: {
            adminAddress?: Address;
            premintItems?: NftMintItemParams<SbtItemParams>[];
            value?: bigint;
            queryId?: bigint;
        },
    ) {
        if (!this.sender) {
            throw new Error('Sender must be defined');
        }

        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }

        const collection = this.api.open(
            SbtCollection.createFromConfig(
                {
                    admin: adminAddress,
                    content: beginCell()
                        .storeRef(
                            await this.contentToCell(
                                nftContentToInternal(content.collectionContent),
                                content?.onchainContent ?? false,
                            ),
                        )
                        .storeRef(beginCell().storeStringTail(content.commonContent))
                        .endCell(),
                },
                SbtCollection.code,
                WORKCHAIN,
                this.contentResolver,
            ),
        );

        if (typeof options?.premintItems?.length === 'number' && options?.premintItems.length > 0) {
            await collection.sendBatchMint(this.sender, options?.premintItems, {
                value: options?.value,
                queryId: options?.queryId,
            });
        } else {
            await collection.sendDeploy(this.sender, options?.value);
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

        const marketplaceAddress = params.marketplace ?? this.sender?.address;
        if (marketplaceAddress === undefined) {
            throw new Error('Marketplace address must be defined in options or be available in Sender');
        }
        const sale = this.api.open(
            NftSale.createFromConfig({
                createdAt: params.createdAt ?? Math.floor(Date.now() / 1000),
                marketplace: params.marketplace ?? null,
                nft: params.nft,
                fullPrice: params.fullPrice,
                marketplaceFeeTo: params.marketplaceFeeTo ?? null,
                marketplaceFee: params.marketplaceFee ?? 0n,
                royaltyTo: params.royaltyTo ?? null,
                royalty: params.royalty ?? 0n,
                canDeployByExternal: params.canDeployByExternal ?? true,
            }),
        );
        await sale.sendTopup(this.sender, { value: params.value, queryId: params.queryId });
        return sale;
    }

    openNftSale(address: Address) {
        return this.api.open(NftSale.createFromAddress(address));
    }

    private async internalOffchainContentToCell(internal: Record<string, string | number | undefined>) {
        const contents = Buffer.from(JSON.stringify(internal), 'utf-8');
        const contentUrl = await retry(() => this.storage.uploadFile(contents), { name: 'upload content' });
        return beginCell().storeUint(0x01, 8).storeStringTail(contentUrl).endCell();
    }

    private async contentToCell(internal: Record<string, string | number | undefined>, onchain: boolean) {
        return onchain ? internalOnchainContentToCell(internal) : await this.internalOffchainContentToCell(internal);
    }
}
