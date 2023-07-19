import { Contract, ContractGetMethodResult, ContractProvider, Transaction, TupleItem } from "ton-core";
import { ExtendedOpenedContract } from "./api";

export interface ExtendedContractProvider extends ContractProvider {
    getLastBlockNumber(): Promise<number>
    getOnBlock(seqno: number, name: string, args: TupleItem[]): Promise<ContractGetMethodResult>;
    getStateOnBlock(seqno: number): Promise<{ lt: bigint | null, hash: Buffer | null, state: 'active' | 'frozen' | 'uninit' }>;
    getLastTransactions(lt: bigint, hash: Buffer): Promise<Transaction[]>;
    reopen<T extends Contract>(contract: T): ExtendedOpenedContract<T>;
}
