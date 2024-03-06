"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jetton = void 0;
const core_1 = require("@ton/core");
const JettonWallet_1 = require("./JettonWallet");
const error_1 = require("../error");
const content_1 = require("../content");
const content_2 = require("./content");
function mintMessage(params) {
    return (0, core_1.beginCell)()
        .storeUint(21, 32)
        .storeUint(params.queryId ?? 0, 64)
        .storeAddress(params.to)
        .storeCoins(params.walletForwardValue ?? (0, core_1.toNano)('0.02'))
        .storeRef((0, core_1.beginCell)()
        .storeUint(0x178d4519, 32)
        .storeUint(params.queryId ?? 0, 64)
        .storeCoins(params.amount)
        .storeAddress(null)
        .storeAddress(params.responseDestination ?? params.to)
        .storeCoins(params.forwardAmount ?? 0)
        .storeMaybeRef(params.forwardPayload))
        .endCell();
}
class Jetton {
    constructor(address, sender, init, contentResolver) {
        this.address = address;
        this.sender = sender;
        this.init = init;
        this.contentResolver = contentResolver;
    }
    static create(params, sender, contentResolver) {
        const data = (0, core_1.beginCell)()
            .storeCoins(0)
            .storeAddress(params.admin)
            .storeRef(params.content)
            .storeRef(JettonWallet_1.JettonWallet.code)
            .endCell();
        const init = { data, code: Jetton.code };
        return new Jetton((0, core_1.contractAddress)(0, init), sender, init, contentResolver);
    }
    static open(address, sender, contentResolver) {
        return new Jetton(address, sender, undefined, contentResolver);
    }
    async getWalletAddress(provider, owner) {
        return (await provider.get('get_wallet_address', [{ type: 'slice', cell: (0, core_1.beginCell)().storeAddress(owner).endCell() }])).stack.readAddress();
    }
    async getWallet(provider, owner) {
        return provider.reopen(new JettonWallet_1.JettonWallet(await this.getWalletAddress(provider, owner), this.sender));
    }
    async getData(provider) {
        const res = (await provider.get('get_jetton_data', [])).stack;
        return {
            totalSupply: res.readBigNumber(),
            mintable: res.readBigNumber() !== 0n,
            adminAddress: res.readAddressOpt(),
            jettonContent: res.readCell(),
            jettonWalletCode: res.readCell(),
        };
    }
    async getContent(provider) {
        if (this.contentResolver === undefined) {
            throw new Error('No content resolver');
        }
        const data = await this.getData(provider);
        return (0, content_2.parseJettonContent)(await (0, content_1.loadFullContent)(data.jettonContent, this.contentResolver));
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
    async sendMint(provider, request) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        await provider.internal(this.sender, {
            value: request.requestValue ?? (0, core_1.toNano)('0.03'),
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            bounce: true,
            body: mintMessage(request),
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
                .endCell(),
        });
    }
}
exports.Jetton = Jetton;
Jetton.code = core_1.Cell.fromBase64('te6ccgECDgEAAqMAART/APSkE/S88sgLAQIBYgIDAgLMBAUCA3pgDA0B9dkGOASS+B8ADoaYGAuNhJL4HwfSB9IBj9ABi465D9ABj9ABg51NoAAWmP6Z/2omh9AH0gamoYQAqpOF1HGZqamxsommOC+XAkgX0gfQBqGBBoQDBrkP0AGBKIGigheASKUCgZ5CgCfQEsZ4tmZmT2qnBBCD3uy+8pOF1AYAk7PwUIgG4KhAJqgoB5CgCfQEsZ4sA54tmZJFkZYCJegB6AGWAZJB8gDg6ZGWBZQPl/+ToO8AMZGWCrGeLKAJ9AQnltYlmZmS4/YBBPSO4DY3NwH6APpA+ChUEgZwVCATVBQDyFAE+gJYzxYBzxbMySLIywES9AD0AMsAyfkAcHTIywLKB8v/ydBQBscF8uBKoQNFRchQBPoCWM8WzMzJ7VQB+kAwINcLAcMAkVvjDeCCECx2uXNScLrjAjU3NyPAA+MCNQLABAcICQoAPoIQ1TJ223CAEMjLBVADzxYi+gISy2rLH8s/yYBC+wAB/jZfA4IImJaAFaAVvPLgSwL6QNMAMJXIIc8WyZFt4oIQ0XNUAHCAGMjLBVAFzxYk+gIUy2oTyx8Uyz8j+kQwcLqOM/goRANwVCATVBQDyFAE+gJYzxYBzxbMySLIywES9AD0AMsAyfkAcHTIywLKB8v/ydDPFpZsInABywHi9AALADQzUDXHBfLgSQP6QDBZyFAE+gJYzxbMzMntVABCjhhRJMcF8uBJ1DBDAMhQBPoCWM8WzMzJ7VTgXwWED/LwAArJgED7AAB9rbz2omh9AH0gamoYNhj8FAC4KhAJqgoB5CgCfQEsZ4sA54tmZJFkZYCJegB6AGWAZPyAODpkZYFlA+X/5OhAAB+vFvaiaH0AfSBqahg/qpBA');
