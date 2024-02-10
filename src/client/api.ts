import {Address, Cell, Contract} from "@ton/core";
import {ExtendedContractProvider} from "./ExtendedContractProvider";
import {getHttpV4Endpoint} from "@orbs-network/ton-access";
import {ExtendedTonClient4} from "./ExtendedTonClient4";

/**
 * Extended contract provider
 * @deprecated use `ContractProvider` instead, will be removed when @ton/core will be updated
 */
export type ExtendedOpenedContract<F> = {
    [P in keyof F]: P extends `${'get' | 'send'}${string}`
        ? (F[P] extends (x: ExtendedContractProvider, ...args: infer P) => infer R ? (...args: P) => R : never)
        : F[P];
}

export interface API {
    /**
     * Opens a contract
     * @param contract
     * @deprecated use `open()` instead, will be removed when @ton/core will be updated
     */
    openExtended<T extends Contract>(contract: T): ExtendedOpenedContract<T>;
    provider(address: Address, init?: { code: Cell; data: Cell; } | null | undefined): ExtendedContractProvider;
}

export async function createApi(network: 'testnet' | 'mainnet'): Promise<API> {
    const endpoint = await getHttpV4Endpoint({network: network});
    return new ExtendedTonClient4({ endpoint: endpoint, timeout: 15000 })
}
