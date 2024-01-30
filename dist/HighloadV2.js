"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HighloadWalletV2 = void 0;
const core_1 = require("@ton/core");
const crypto_1 = require("@ton/crypto");
const utils_1 = require("./utils");
class HighloadWalletV2 {
    constructor(address, init, walletId = 0) {
        this.address = address;
        this.init = init;
        this.walletId = walletId;
    }
    static create(params) {
        const walletId = params.walletId ?? 0;
        const data = (0, core_1.beginCell)()
            .storeUint(walletId, 32)
            .storeUint(0, 64)
            .storeBuffer(params.publicKey, 32)
            .storeDict(null)
            .endCell();
        const init = { code: HighloadWalletV2.code, data };
        return new HighloadWalletV2((0, core_1.contractAddress)(params.workchain, init), init, walletId);
    }
    static createFromAddress(address) {
        return new HighloadWalletV2(address);
    }
    static makeQueryId(timeout, seqno) {
        const to = typeof timeout === 'number' ? timeout : 3600;
        const seq = typeof seqno === 'number' ? seqno : Math.floor(Math.random() * (1 << 32));
        return (BigInt(Math.floor(Date.now() / 1000) + to) << 32n) + BigInt(seq);
    }
    _createTransfer(args) {
        const queryId = HighloadWalletV2.makeQueryId(args.timeout, args.seqno);
        const dict = core_1.Dictionary.empty(core_1.Dictionary.Keys.Int(16), {
            serialize: (m, b) => {
                b.storeUint(args.sendMode ?? (core_1.SendMode.PAY_GAS_SEPARATELY | core_1.SendMode.IGNORE_ERRORS), 8);
                b.storeRef((0, core_1.beginCell)().storeWritable((0, core_1.storeMessageRelaxed)(m)));
            },
            parse: () => { throw new Error('Unsupported'); },
        });
        for (let i = 0; i < args.messages.length; i++) {
            dict.set(i, args.messages[i]);
        }
        const signedMessage = (0, core_1.beginCell)()
            .storeUint(this.walletId, 32)
            .storeUint(queryId, 64)
            .storeDict(dict)
            .endCell();
        const hash = signedMessage.hash();
        const signature = (0, crypto_1.sign)(hash, args.secretKey);
        return {
            queryId,
            transfer: (0, core_1.beginCell)()
                .storeBuffer(signature)
                .storeSlice(signedMessage.beginParse())
                .endCell(),
        };
    }
    createTransfer(args) {
        return this._createTransfer(args).transfer;
    }
    async sendTransfer(provider, args) {
        await provider.external(this.createTransfer(args));
    }
    async getProcessedStatus(provider, arg) {
        const queryId = typeof arg === 'bigint' ? arg : HighloadWalletV2.makeQueryId(arg.timeout, arg.seqno);
        const ret = (await provider.get('processed?', [{ type: 'int', value: queryId }])).stack.readBigNumber();
        switch (ret) {
            case -1n:
                return 'processed';
            case 0n:
                return 'unprocessed';
            case 1n:
                return 'forgotten';
            default:
                throw new Error('Unknown processed status ' + ret);
        }
    }
    async getPublicKey(provider) {
        const ret = (await provider.get('get_public_key', [])).stack.readBigNumber();
        return Buffer.from(ret.toString(16), 'hex');
    }
    async sendTransferAndWait(provider, args, sleepInterval = 3000) {
        const { queryId, transfer } = this._createTransfer(args);
        await provider.external(transfer);
        while (true) {
            await (0, utils_1.sleep)(sleepInterval);
            const state = await provider.getState();
            if (state.state.type === 'uninit')
                continue;
            const status = await this.getProcessedStatus(provider, queryId);
            if (status === 'processed')
                return;
            else if (status === 'forgotten')
                throw new Error('The transfer was forgotten');
            try {
                await provider.external(transfer);
            }
            catch (e) { }
        }
    }
}
exports.HighloadWalletV2 = HighloadWalletV2;
HighloadWalletV2.code = core_1.Cell.fromBase64('te6cckEBCQEA5QABFP8A9KQT9LzyyAsBAgEgAgMCAUgEBQHq8oMI1xgg0x/TP/gjqh9TILnyY+1E0NMf0z/T//QE0VNggED0Dm+hMfJgUXO68qIH+QFUEIf5EPKjAvQE0fgAf44WIYAQ9HhvpSCYAtMH1DAB+wCRMuIBs+ZbgyWhyEA0gED0Q4rmMQHIyx8Tyz/L//QAye1UCAAE0DACASAGBwAXvZznaiaGmvmOuF/8AEG+X5dqJoaY+Y6Z/p/5j6AmipEEAgegc30JjJLb/JXdHxQANCCAQPSWb6VsEiCUMFMDud4gkzM2AZJsIeKzn55UWg==');
