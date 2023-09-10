import { Address, Cell, Contract, TonClient4, openContract } from "@ton/ton";
import { ExtendedContractProvider } from "./ExtendedContractProvider";
import { ExtendedOpenedContract } from "./api";

export class ExtendedTonClient4 extends TonClient4 {
    openExtended<T extends Contract>(contract: T): ExtendedOpenedContract<T> {
        return openContract(contract, (args) => this.provider(args.address, args.init)) as any;
    }

    provider(address: Address, init?: { code: Cell; data: Cell; } | null | undefined): ExtendedContractProvider {
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
        }
    }
}
