import {Contract, ContractProvider} from "@ton/core";
import {ExtendedOpenedContract} from "./api";

/**
 * Extended contract provider
 * @deprecated use `ContractProvider` instead, will be removed when @ton/core will be updated
 */
export interface ExtendedContractProvider extends ContractProvider {
    reopen<T extends Contract>(contract: T): ExtendedOpenedContract<T>;
}
