import { Address, Cell, Contract, TonClient4 } from "@ton/ton";
import { ExtendedContractProvider } from "./ExtendedContractProvider";
import { ExtendedOpenedContract } from "./api";
export declare class ExtendedTonClient4 extends TonClient4 {
    openExtended<T extends Contract>(contract: T): ExtendedOpenedContract<T>;
    provider(address: Address, init?: {
        code: Cell;
        data: Cell;
    } | null | undefined): ExtendedContractProvider;
}
