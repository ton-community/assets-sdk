import { Contract, ContractProvider } from "@ton/core";
import { ExtendedOpenedContract } from "./api";

export interface ExtendedContractProvider extends ContractProvider {
    reopen<T extends Contract>(contract: T): ExtendedOpenedContract<T>;
}
