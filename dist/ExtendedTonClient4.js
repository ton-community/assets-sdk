"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendedTonClient4 = void 0;
const ton_1 = require("@ton/ton");
class ExtendedTonClient4 extends ton_1.TonClient4 {
    openExtended(contract) {
        return (0, ton_1.openContract)(contract, (args) => this.provider(args.address, args.init));
    }
    provider(address, init) {
        return {
            ...super.provider(address, init),
            getLastBlockNumber: async () => {
                return (await this.getLastBlock()).last.seqno;
            },
            getStateOnBlock: async (seqno) => {
                const state = await this.getAccountLite(seqno, address);
                return {
                    state: state.account.state.type,
                    lt: state.account.last?.lt === undefined ? null : BigInt(state.account.last.lt),
                    hash: state.account.last?.hash === undefined ? null : Buffer.from(state.account.last.hash, 'base64'),
                };
            },
            getOnBlock: async (seqno, method, args) => {
                const res = await this.runMethod(seqno, address, method, args);
                return {
                    stack: res.reader,
                };
            },
            getLastTransactions: async (lt, hash) => {
                const res = await this.getAccountTransactions(address, lt, hash);
                return res.map(e => e.tx);
            },
            reopen: (contract) => {
                return this.openExtended(contract);
            }
        };
    }
}
exports.ExtendedTonClient4 = ExtendedTonClient4;
