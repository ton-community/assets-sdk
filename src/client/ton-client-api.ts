import {Address, Cell, Contract, ContractProvider, OpenedContract} from "@ton/core";
import {TonClient4} from "@ton/ton";
import {getHttpV4Endpoint} from "@orbs-network/ton-access";

export interface TonClientApi {
    open<T extends Contract>(contract: T): OpenedContract<T>;
    provider(address: Address, init?: { code: Cell; data: Cell; } | null | undefined): ContractProvider;
}

export async function createApi(network: 'testnet' | 'mainnet'): Promise<TonClientApi> {
    const endpoint = await getHttpV4Endpoint({network: network});
    return new TonClient4({ endpoint: endpoint, timeout: 15000 })
}
