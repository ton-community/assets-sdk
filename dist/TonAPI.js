"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TonAPI = void 0;
const core_1 = require("@ton/core");
const zod_1 = __importDefault(require("zod"));
const axios_1 = __importDefault(require("axios"));
const Address = zod_1.default.string().transform(v => core_1.Address.parseRaw(v));
const HexBuffer = zod_1.default.string().transform(v => Buffer.from(v, 'hex'));
const zBigint = zod_1.default.union([zod_1.default.number(), zod_1.default.string()]).transform(v => BigInt(v));
const zStrnum = zod_1.default.union([zod_1.default.number(), zod_1.default.string()]).transform(v => Number(v));
const ImagePreview = zod_1.default.object({
    resolution: zod_1.default.string(),
    url: zod_1.default.string(),
});
const AccountAddress = zod_1.default.object({
    address: Address,
    name: zod_1.default.optional(zod_1.default.string()),
    is_scam: zod_1.default.boolean(),
    icon: zod_1.default.optional(zod_1.default.string()),
    is_wallet: zod_1.default.boolean(),
});
const NftCollection = zod_1.default.object({
    address: Address,
    next_item_index: zBigint,
    owner: zod_1.default.optional(AccountAddress),
    metadata: zod_1.default.optional(zod_1.default.record(zod_1.default.any())),
    raw_collection_content: HexBuffer,
    previews: zod_1.default.optional(zod_1.default.array(ImagePreview)),
    approved_by: zod_1.default.array(zod_1.default.string()),
});
const NftCollections = zod_1.default.object({
    nft_collections: zod_1.default.array(NftCollection),
});
const Price = zod_1.default.object({
    value: zBigint,
    token_name: zod_1.default.string(),
});
const Sale = zod_1.default.object({
    address: Address,
    market: AccountAddress,
    owner: zod_1.default.optional(AccountAddress),
    price: Price,
});
const NftItem = zod_1.default.object({
    address: Address,
    index: zBigint,
    owner: zod_1.default.optional(AccountAddress),
    collection: zod_1.default.optional(zod_1.default.object({
        address: Address,
        name: zod_1.default.string(),
        description: zod_1.default.string(),
    })),
    verified: zod_1.default.boolean(),
    metadata: zod_1.default.record(zod_1.default.any()),
    sale: zod_1.default.optional(Sale),
    previews: zod_1.default.optional(zod_1.default.array(ImagePreview)),
    dns: zod_1.default.optional(zod_1.default.string()),
    approved_by: zod_1.default.array(zod_1.default.string()),
});
const NftItems = zod_1.default.object({
    nft_items: zod_1.default.array(NftItem),
});
const JettonVerificationType = zod_1.default.union([zod_1.default.literal('whitelist'), zod_1.default.literal('blacklist'), zod_1.default.literal('none')]);
const JettonMetadata = zod_1.default.object({
    address: Address,
    name: zod_1.default.string(),
    symbol: zod_1.default.string(),
    decimals: zStrnum,
    image: zod_1.default.optional(zod_1.default.string()),
    description: zod_1.default.optional(zod_1.default.string()),
    social: zod_1.default.optional(zod_1.default.array(zod_1.default.string())),
    websites: zod_1.default.optional(zod_1.default.array(zod_1.default.string())),
    catalogs: zod_1.default.optional(zod_1.default.array(zod_1.default.string())),
});
const JettonInfo = zod_1.default.object({
    mintable: zod_1.default.boolean(),
    total_supply: zBigint,
    metadata: JettonMetadata,
    verification: JettonVerificationType,
    holders_count: zod_1.default.number(),
});
const Jettons = zod_1.default.object({
    jettons: zod_1.default.array(JettonInfo),
});
const JettonHolder = zod_1.default.object({
    address: Address,
    owner: AccountAddress,
    balance: zBigint,
});
const JettonHolders = zod_1.default.object({
    addresses: zod_1.default.array(JettonHolder),
});
const EncryptedComment = zod_1.default.object({
    encryption_type: zod_1.default.string(),
    cipher_text: HexBuffer,
});
const Refund = zod_1.default.object({
    type: zod_1.default.string(),
    origin: Address,
});
const NftItemTransferAction = zod_1.default.object({
    sender: zod_1.default.optional(AccountAddress),
    recipient: zod_1.default.optional(AccountAddress),
    nft: Address,
    comment: zod_1.default.optional(zod_1.default.string()),
    encrypted_comment: zod_1.default.optional(EncryptedComment),
    payload: zod_1.default.optional(HexBuffer),
    refund: zod_1.default.optional(Refund),
});
const ActionStatus = zod_1.default.union([zod_1.default.literal('ok'), zod_1.default.literal('failed')]);
const ActionSpecificNftItemTransfer = zod_1.default.object({
    type: zod_1.default.literal('NftItemTransfer'),
    status: ActionStatus,
    NftItemTransfer: NftItemTransferAction,
}).transform(v => ({
    status: v.status,
    ...v.NftItemTransfer,
}));
const AccountEventGeneric = (t) => zod_1.default.object({
    event_id: zod_1.default.string(),
    account: AccountAddress,
    timestamp: zod_1.default.number(),
    actions: zod_1.default.array(t),
    is_scam: zod_1.default.boolean(),
    lt: zBigint,
    in_progress: zod_1.default.boolean(),
});
const AccountEventNftItemTransfer = AccountEventGeneric(ActionSpecificNftItemTransfer);
const AccountEventsGeneric = (t) => zod_1.default.object({
    events: zod_1.default.array(t),
    next_from: zBigint,
});
const AccountEventsNftItemTransfer = AccountEventsGeneric(AccountEventNftItemTransfer);
const TokenRates = zod_1.default.object({
    prices: zod_1.default.optional(zod_1.default.record(zod_1.default.number())),
    diff_24h: zod_1.default.optional(zod_1.default.record(zod_1.default.string())),
    diff_7d: zod_1.default.optional(zod_1.default.record(zod_1.default.string())),
    diff_30d: zod_1.default.optional(zod_1.default.record(zod_1.default.string())),
});
const JettonPreview = zod_1.default.object({
    address: Address,
    name: zod_1.default.string(),
    symbol: zod_1.default.string(),
    decimals: zStrnum,
    image: zod_1.default.string(),
    verification: JettonVerificationType,
});
const JettonBalance = zod_1.default.object({
    balance: zBigint,
    price: zod_1.default.optional(TokenRates),
    wallet_address: AccountAddress,
    jetton: JettonPreview,
});
const JettonBalances = zod_1.default.object({
    balances: zod_1.default.array(JettonBalance),
});
const rawAddress = (address) => {
    return typeof address === 'string' ? address : address.toRawString();
};
class TonAPI {
    constructor(params) {
        this.instance = axios_1.default.create({
            baseURL: params?.baseURL ?? 'https://tonapi.io',
            headers: params?.token === undefined ? {} : {
                'Authorization': 'Bearer ' + params.token,
            },
        });
    }
    async getNftCollections(params) {
        return NftCollections.parse((await this.instance.get('/v2/nfts/collections', {
            params,
        })).data).nft_collections;
    }
    async getNftCollection(collection) {
        return NftCollection.parse((await this.instance.get(`/v2/nfts/collections/${rawAddress(collection)}`)).data);
    }
    async getNftCollectionItems(collection, params) {
        return NftItems.parse((await this.instance.get(`/v2/nfts/collections/${rawAddress(collection)}/items`, {
            params,
        })).data).nft_items;
    }
    async getNftItems(items) {
        return NftItems.parse((await this.instance.post(`/v2/nfts/_bulk`, {
            account_ids: items.map(rawAddress),
        })).data).nft_items;
    }
    async getNftItem(item) {
        return NftItem.parse((await this.instance.get(`/v2/nfts/${rawAddress(item)}`)).data);
    }
    async getJettons(params) {
        return Jettons.parse((await this.instance.get('/v2/jettons', {
            params,
        })).data).jettons;
    }
    async getJetton(jettonMaster) {
        return JettonInfo.parse((await this.instance.get(`/v2/jettons/${rawAddress(jettonMaster)}`)).data);
    }
    async getJettonHolders(jettonMaster, params) {
        return JettonHolders.parse((await this.instance.get(`/v2/jettons/${rawAddress(jettonMaster)}/holders`, {
            params,
        })).data).addresses;
    }
    async getNftItemTransferHistory(item, params) {
        return AccountEventsNftItemTransfer.parse((await this.instance.get(`/v2/nfts/${rawAddress(item)}/history`, {
            params: {
                limit: 100,
                ...params,
            },
        })).data);
    }
    async getAccountNfts(account, params) {
        return NftItems.parse((await this.instance.get(`/v2/accounts/${rawAddress(account)}/nfts`, {
            params: {
                ...params,
                collection: params?.collection === undefined ? undefined : rawAddress(params.collection),
            },
        })).data).nft_items;
    }
    async getAccountJettons(account, params) {
        return JettonBalances.parse((await this.instance.get(`/v2/accounts/${rawAddress(account)}/jettons`, {
            params: {
                currencies: params?.currencies === undefined ? undefined : params.currencies.join(','),
            },
        })).data).balances;
    }
}
exports.TonAPI = TonAPI;
