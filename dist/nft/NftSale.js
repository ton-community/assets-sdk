"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftSale = void 0;
const core_1 = require("@ton/core");
const error_1 = require("../error");
class NftSale {
    constructor(address, sender, init) {
        this.address = address;
        this.sender = sender;
        this.init = init;
    }
    static create(params, sender) {
        const data = (0, core_1.beginCell)()
            .storeBit(false)
            .storeUint(params.createdAt, 32)
            .storeAddress(params.marketplace)
            .storeAddress(params.nft)
            .storeAddress(null)
            .storeCoins(params.fullPrice)
            .storeRef((0, core_1.beginCell)()
            .storeAddress(params.marketplaceFeeTo)
            .storeCoins(params.marketplaceFee)
            .storeAddress(params.royaltyTo)
            .storeCoins(params.royalty))
            .storeBit(params.canDeployByExternal)
            .endCell();
        const init = { data, code: NftSale.code };
        return new NftSale((0, core_1.contractAddress)(0, init), sender, init);
    }
    static open(address, sender) {
        return new NftSale(address, sender);
    }
    async sendTopup(provider, value, queryId) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        await provider.internal(this.sender, {
            value,
            bounce: true,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(1, 32)
                .storeUint(queryId ?? 0, 64)
                .endCell(),
        });
    }
    async sendAdminMessage(provider, params) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        const builder = (0, core_1.beginCell)()
            .storeUint(555, 32)
            .storeUint(params.queryId ?? 0, 64);
        if (params.message instanceof core_1.Cell) {
            builder.storeRef(builder);
        }
        else {
            builder.storeRef((0, core_1.beginCell)().store((0, core_1.storeMessageRelaxed)(params.message)));
        }
        await provider.internal(this.sender, {
            value: params.value,
            bounce: true,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: builder
                .storeUint(params.sendMode, 8)
                .endCell(),
        });
    }
    async sendCancel(provider, value, queryId) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        await provider.internal(this.sender, {
            value,
            bounce: true,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(3, 32)
                .storeUint(queryId ?? 0, 64)
                .endCell(),
        });
    }
    async sendBuy(provider, value, queryId) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        await provider.internal(this.sender, {
            value,
            bounce: true,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(2, 32)
                .storeUint(queryId ?? 0, 64)
                .endCell(),
        });
    }
    async sendDeployExternal(provider) {
        await provider.external(new core_1.Cell());
    }
    async getData(provider) {
        const { stack } = await provider.get('get_sale_data', []);
        return {
            type: stack.readNumber(),
            isComplete: stack.readBoolean(),
            createdAt: stack.readNumber(),
            marketplace: stack.readAddress(),
            nft: stack.readAddress(),
            nftOwner: stack.readAddressOpt(),
            fullPrice: stack.readBigNumber(),
            marketplaceFeeTo: stack.readAddress(),
            marketplaceFee: stack.readBigNumber(),
            royaltyTo: stack.readAddress(),
            royalty: stack.readBigNumber(),
        };
    }
}
exports.NftSale = NftSale;
NftSale.code = core_1.Cell.fromBase64('te6cckECCwEAArkAART/APSkE/S88sgLAQIBIAMCAH7yMO1E0NMA0x/6QPpA+kD6ANTTADDAAY4d+ABwB8jLABbLH1AEzxZYzxYBzxYB+gLMywDJ7VTgXweCAP/+8vACAUgFBABXoDhZ2omhpgGmP/SB9IH0gfQBqaYAYGGh9IH0AfSB9ABhBCCMkrCgFYACqwECAs0IBgH3ZghA7msoAUmCgUjC+8uHCJND6QPoA+kD6ADBTkqEhoVCHoRagUpBwgBDIywVQA88WAfoCy2rJcfsAJcIAJddJwgKwjhdQRXCAEMjLBVADzxYB+gLLaslx+wAQI5I0NOJacIAQyMsFUAPPFgH6AstqyXH7AHAgghBfzD0UgcAlsjLHxPLPyPPFlADzxbKAIIJycOA+gLKAMlxgBjIywUmzxZw+gLLaszJgwb7AHFVUHAHyMsAFssfUATPFljPFgHPFgH6AszLAMntVAH30A6GmBgLjYSS+CcH0gGHaiaGmAaY/9IH0gfSB9AGppgBgYOCmE44BgAEqYhOmPhW8Q4YBKGATpn8cIxbMbC3MbK2QV44LJOZlvKAVxFWAAyS+G8BJrpOEBFcCBFd0VYACRWdjYKdxjgthOjq+G6hhoaYPqGAD9gHAU4ADAkB6PLRlLOOQjEzOTlTUscFkl8J4FFRxwXy4fSCEAUTjZEWuvLh9QP6QDBGUBA0WXAHyMsAFssfUATPFljPFgHPFgH6AszLAMntVOAwNyjAA+MCKMAAnDY3EDhHZRRDMHDwBeAIwAKYVUQQJBAj8AXgXwqED/LwCgDUODmCEDuaygAYvvLhyVNGxwVRUscFFbHy4cpwIIIQX8w9FCGAEMjLBSjPFiH6Astqyx8Vyz8nzxYnzxYUygAj+gITygDJgwb7AHFQZkUVBHAHyMsAFssfUATPFljPFgHPFgH6AszLAMntVOBqUYM=');
