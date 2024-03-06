import {Address, Cell, Contract, ContractProvider, OpenedContract} from "@ton/core";
import {TonClient4} from "@ton/ton";
import {getHttpV4Endpoint} from "@orbs-network/ton-access";

/**
 * The TonClientApi interface provides a way to interact with the TON network
 */
export interface TonClientApi {

    /**
     * Open a contract
     * @param contract - The contract to open
     */
    open<T extends Contract>(contract: T): OpenedContract<T>;

    /**
     * Create a new contract provider
     * @param address - The address of the contract
     * @param init - The initial state of the contract
     */
    provider(address: Address, init?: { code: Cell; data: Cell; } | null | undefined): ContractProvider;
}

/**
 * Create a new TonClient4 instance with the given network
 * @param network - The network to connect to (testnet or mainnet)
 */
export async function createApi(network: 'testnet' | 'mainnet'): Promise<TonClientApi> {
    const endpoint = await getHttpV4Endpoint({network: network});
    return new TonClient4({ endpoint: endpoint, timeout: 15000 })
}
