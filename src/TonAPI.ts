import { Address as TONAddress } from '@ton/core';
import z from 'zod';
import axios, { AxiosInstance } from 'axios';

const Address = z.string().transform(v => TONAddress.parseRaw(v));
const HexBuffer = z.string().transform(v => Buffer.from(v, 'hex'));
const zBigint = z.union([z.number(), z.string()]).transform(v => BigInt(v));
const zStrnum = z.union([z.number(), z.string()]).transform(v => Number(v));

const ImagePreview = z.object({
    resolution: z.string(),
    url: z.string(),
});

const AccountAddress = z.object({
    address: Address,
    name: z.optional(z.string()),
    is_scam: z.boolean(),
    icon: z.optional(z.string()),
    is_wallet: z.boolean(),
});

const NftCollection = z.object({
    address: Address,
    next_item_index: zBigint,
    owner: z.optional(AccountAddress),
    metadata: z.optional(z.record(z.any())),
    raw_collection_content: HexBuffer,
    previews: z.optional(z.array(ImagePreview)),
    approved_by: z.array(z.string()),
});

const NftCollections = z.object({
    nft_collections: z.array(NftCollection),
});

const Price = z.object({
    value: zBigint,
    token_name: z.string(),
});

const Sale = z.object({
    address: Address,
    market: AccountAddress,
    owner: z.optional(AccountAddress),
    price: Price,
});

const NftItem = z.object({
    address: Address,
    index: zBigint,
    owner: z.optional(AccountAddress),
    collection: z.optional(z.object({
        address: Address,
        name: z.string(),
        description: z.string(),
    })),
    verified: z.boolean(),
    metadata: z.record(z.any()),
    sale: z.optional(Sale),
    previews: z.optional(z.array(ImagePreview)),
    dns: z.optional(z.string()),
    approved_by: z.array(z.string()),
});

const NftItems = z.object({
    nft_items: z.array(NftItem),
});

const JettonVerificationType = z.union([z.literal('whitelist'), z.literal('blacklist'), z.literal('none')]);

const JettonMetadata = z.object({
    address: Address,
    name: z.string(),
    symbol: z.string(),
    decimals: zStrnum,
    image: z.optional(z.string()),
    description: z.optional(z.string()),
    social: z.optional(z.array(z.string())),
    websites: z.optional(z.array(z.string())),
    catalogs: z.optional(z.array(z.string())),
});

const JettonInfo = z.object({
    mintable: z.boolean(),
    total_supply: zBigint,
    metadata: JettonMetadata,
    verification: JettonVerificationType,
    holders_count: z.number(),
});

const Jettons = z.object({
    jettons: z.array(JettonInfo),
});

const JettonHolder = z.object({
    address: Address,
    owner: AccountAddress,
    balance: zBigint,
});

const JettonHolders = z.object({
    addresses: z.array(JettonHolder),
});

const EncryptedComment = z.object({
    encryption_type: z.string(),
    cipher_text: HexBuffer,
});

const Refund = z.object({
    type: z.string(),
    origin: Address,
});

const NftItemTransferAction = z.object({
    sender: z.optional(AccountAddress),
    recipient: z.optional(AccountAddress),
    nft: Address,
    comment: z.optional(z.string()),
    encrypted_comment: z.optional(EncryptedComment),
    payload: z.optional(HexBuffer),
    refund: z.optional(Refund),
});

const ActionStatus = z.union([z.literal('ok'), z.literal('failed')]);

const ActionSpecificNftItemTransfer = z.object({
    type: z.literal('NftItemTransfer'),
    status: ActionStatus,
    NftItemTransfer: NftItemTransferAction,
}).transform(v => ({
    status: v.status,
    ...v.NftItemTransfer,
}));

const AccountEventGeneric = <T extends z.ZodTypeAny>(t: T) => z.object({
    event_id: z.string(),
    account: AccountAddress,
    timestamp: z.number(),
    actions: z.array(t),
    is_scam: z.boolean(),
    lt: zBigint,
    in_progress: z.boolean(),
});

const AccountEventNftItemTransfer = AccountEventGeneric(ActionSpecificNftItemTransfer);

const AccountEventsGeneric = <T extends z.ZodTypeAny>(t: T) => z.object({
    events: z.array(t),
    next_from: zBigint,
});

const AccountEventsNftItemTransfer = AccountEventsGeneric(AccountEventNftItemTransfer);

const TokenRates = z.object({
    prices: z.optional(z.record(z.number())),
    diff_24h: z.optional(z.record(z.string())),
    diff_7d: z.optional(z.record(z.string())),
    diff_30d: z.optional(z.record(z.string())),
});

const JettonPreview = z.object({
    address: Address,
    name: z.string(),
    symbol: z.string(),
    decimals: zStrnum,
    image: z.string(),
    verification: JettonVerificationType,
});

const JettonBalance = z.object({
    balance: zBigint,
    price: z.optional(TokenRates),
    wallet_address: AccountAddress,
    jetton: JettonPreview,
});

const JettonBalances = z.object({
    balances: z.array(JettonBalance),
});

const rawAddress = (address: TONAddress | string) => {
    return typeof address === 'string' ? address : address.toRawString();
};

export class TonAPI {
    readonly instance: AxiosInstance;

    constructor(params?: {
        baseURL?: string,
        token?: string,
    }) {
        this.instance = axios.create({
            baseURL: params?.baseURL ?? 'https://tonapi.io',
            headers: params?.token === undefined ? {} : {
                'Authorization': 'Bearer ' + params.token,
            },
        });
    }

    async getNftCollections(params?: {
        limit?: number,
        offset?: number,
    }) {
        return NftCollections.parse((await this.instance.get('/v2/nfts/collections', {
            params,
        })).data).nft_collections;
    }

    async getNftCollection(collection: TONAddress | string) {
        return NftCollection.parse((await this.instance.get(`/v2/nfts/collections/${rawAddress(collection)}`)).data);
    }

    async getNftCollectionItems(collection: TONAddress | string, params?: {
        limit?: number,
        offset?: number,
    }) {
        return NftItems.parse((await this.instance.get(`/v2/nfts/collections/${rawAddress(collection)}/items`, {
            params,
        })).data).nft_items;
    }

    async getNftItems(items: (TONAddress | string)[]) {
        return NftItems.parse((await this.instance.post(`/v2/nfts/_bulk`, {
            account_ids: items.map(rawAddress),
        })).data).nft_items;
    }

    async getNftItem(item: TONAddress | string) {
        return NftItem.parse((await this.instance.get(`/v2/nfts/${rawAddress(item)}`)).data);
    }

    async getJettons(params?: {
        limit?: number,
        offset?: number,
    }) {
        return Jettons.parse((await this.instance.get('/v2/jettons', {
            params,
        })).data).jettons;
    }

    async getJetton(jettonMaster: TONAddress | string) {
        return JettonInfo.parse((await this.instance.get(`/v2/jettons/${rawAddress(jettonMaster)}`)).data);
    }

    async getJettonHolders(jettonMaster: TONAddress | string, params?: {
        limit?: number,
        offset?: number,
    }) {
        return JettonHolders.parse((await this.instance.get(`/v2/jettons/${rawAddress(jettonMaster)}/holders`, {
            params,
        })).data).addresses;
    }

    async getNftItemTransferHistory(item: TONAddress | string, params?: {
        before_lt?: bigint,
        limit?: number,
        start_date?: number,
        end_date?: number,
    }) {
        return AccountEventsNftItemTransfer.parse((await this.instance.get(`/v2/nfts/${rawAddress(item)}/history`, {
            params: {
                limit: 100,
                ...params,
            },
        })).data);
    }

    async getAccountNfts(account: TONAddress | string, params?: {
        collection?: TONAddress | string,
        limit?: number,
        offset?: number,
        indirect_ownership?: boolean,
    }) {
        return NftItems.parse((await this.instance.get(`/v2/accounts/${rawAddress(account)}/nfts`, {
            params: {
                ...params,
                collection: params?.collection === undefined ? undefined : rawAddress(params.collection),
            },
        })).data).nft_items;
    }

    async getAccountJettons(account: TONAddress | string, params?: {
        currencies?: string[],
    }) {
        return JettonBalances.parse((await this.instance.get(`/v2/accounts/${rawAddress(account)}/jettons`, {
            params: {
                currencies: params?.currencies === undefined ? undefined : params.currencies.join(','),
            },
        })).data).balances;
    }
}
