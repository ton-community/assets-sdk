"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftCollectionBase = void 0;
const core_1 = require("@ton/core");
const error_1 = require("../error");
const NftItem_1 = require("./NftItem");
const content_1 = require("../content");
const content_2 = require("./content");
function storeSingleMintRequest(request, storeParams) {
    return (builder) => {
        builder
            .storeCoins(request.value ?? (0, core_1.toNano)('0.03'))
            .storeRef(request.itemParams instanceof core_1.Cell ? request.itemParams : storeParams(request.itemParams));
    };
}
class NftCollectionBase {
    constructor(address, sender, init, contentResolver) {
        this.address = address;
        this.sender = sender;
        this.init = init;
        this.contentResolver = contentResolver;
    }
    async getItemAddress(provider, index) {
        return (await provider.get('get_nft_address_by_index', [{ type: 'int', value: index }])).stack.readAddress();
    }
    async getItem(provider, index) {
        return provider.reopen(new NftItem_1.NftItem(await this.getItemAddress(provider, index), this.sender));
    }
    mintMessage(request) {
        return (0, core_1.beginCell)()
            .storeUint(1, 32)
            .storeUint(request.queryId ?? 0, 64)
            .storeUint(request.itemIndex, 64)
            .storeWritable(storeSingleMintRequest(request, this.paramsToCell))
            .endCell();
    }
    batchMintMessage(request) {
        const dict = core_1.Dictionary.empty(core_1.Dictionary.Keys.BigUint(64), {
            serialize: (r, b) => storeSingleMintRequest(r, this.paramsToCell)(b),
            parse: () => { throw new Error('Unsupported'); },
        });
        for (const r of request.requests) {
            if (dict.has(r.itemIndex)) {
                throw new Error('Duplicate items');
            }
            dict.set(r.itemIndex, r);
        }
        return (0, core_1.beginCell)()
            .storeUint(2, 32)
            .storeUint(request.queryId ?? 0, 64)
            .storeRef((0, core_1.beginCell)().storeDictDirect(dict))
            .endCell();
    }
    async sendMint(provider, request) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        await provider.internal(this.sender, {
            value: request.requestValue ?? (0, core_1.toNano)('0.05'),
            bounce: true,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: this.mintMessage(request),
        });
    }
    async sendBatchMint(provider, request) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        await provider.internal(this.sender, {
            value: request.requestValue ?? (0, core_1.toNano)('0.05'),
            bounce: true,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: this.batchMintMessage(request),
        });
    }
    async sendDeploy(provider, value) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        await provider.internal(this.sender, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            bounce: true,
        });
    }
    async sendChangeAdmin(provider, params) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        await provider.internal(this.sender, {
            value: params.value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            bounce: true,
            body: (0, core_1.beginCell)()
                .storeUint(3, 32)
                .storeUint(params.queryId ?? 0, 64)
                .storeAddress(params.newAdmin)
                .endCell(),
        });
    }
    async sendChangeContent(provider, params) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        await provider.internal(this.sender, {
            value: params.value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            bounce: true,
            body: (0, core_1.beginCell)()
                .storeUint(4, 32)
                .storeUint(params.queryId ?? 0, 64)
                .storeRef(params.newContent)
                .storeRef(params.newRoyaltyParams)
                .endCell(),
        });
    }
    async getData(provider) {
        const ret = await provider.get('get_collection_data', []);
        return {
            nextItemIndex: ret.stack.readBigNumber(),
            content: ret.stack.readCell(),
            owner: ret.stack.readAddressOpt(),
        };
    }
    async getContent(provider) {
        if (this.contentResolver === undefined) {
            throw new Error('No content resolver');
        }
        const data = await this.getData(provider);
        return (0, content_2.parseNftContent)(await (0, content_1.loadFullContent)(data.content, this.contentResolver));
    }
    async getItemContent(provider, index, individualContent) {
        return (await provider.get('get_nft_content', [{
                type: 'int',
                value: index,
            }, {
                type: 'cell',
                cell: individualContent,
            }])).stack.readCell();
    }
}
exports.NftCollectionBase = NftCollectionBase;
NftCollectionBase.code = core_1.Cell.fromBase64('te6cckECEwEAAf4AART/APSkE/S88sgLAQIBYgIDAgLNBAUCASANDgPr0QY4BIrfAA6GmBgLjYSK3wfSAYAOmP6Z/2omh9IGmf6mpqGEEINJ6cqClAXUcUG6+CgOhBCFRlgFa4QAhkZYKoAueLEn0BCmW1CeWP5Z+A54tkwCB9gHAbKLnjgvlwyJLgAPGBEuABcYEZAmAB8YEvgsIH+XhAYHCAIBIAkKAGA1AtM/UxO78uGSUxO6AfoA1DAoEDRZ8AaOEgGkQ0PIUAXPFhPLP8zMzMntVJJfBeIApjVwA9QwjjeAQPSWb6UgjikGpCCBAPq+k/LBj96BAZMhoFMlu/L0AvoA1DAiVEsw8AYjupMCpALeBJJsIeKz5jAyUERDE8hQBc8WE8s/zMzMye1UACgB+kAwQUTIUAXPFhPLP8zMzMntVAIBIAsMAD1FrwBHAh8AV3gBjIywVYzxZQBPoCE8trEszMyXH7AIAC0AcjLP/gozxbJcCDIywET9AD0AMsAyYAAbPkAdMjLAhLKB8v/ydCACASAPEAAlvILfaiaH0gaZ/qamoYLehqGCxABDuLXTHtRND6QNM/1NTUMBAkXwTQ1DHUMNBxyMsHAc8WzMmAIBIBESAC+12v2omh9IGmf6mpqGDYg6GmH6Yf9IBhAALbT0faiaH0gaZ/qamoYCi+CeAI4APgCwWurO9Q==');
