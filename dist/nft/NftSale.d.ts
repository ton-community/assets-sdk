import { Address, Cell, Contract, ContractProvider, MessageRelaxed, SendMode, Sender } from "@ton/core";
import { NftSaleData } from "./data";
export declare class NftSale implements Contract {
    readonly address: Address;
    sender?: Sender | undefined;
    readonly init?: {
        code: Cell;
        data: Cell;
    } | undefined;
    static code: Cell;
    constructor(address: Address, sender?: Sender | undefined, init?: {
        code: Cell;
        data: Cell;
    } | undefined);
    static create(params: {
        createdAt: number;
        marketplace: Address | null;
        nft: Address;
        fullPrice: bigint;
        marketplaceFeeTo: Address | null;
        marketplaceFee: bigint;
        royaltyTo: Address | null;
        royalty: bigint;
        canDeployByExternal: boolean;
    }, sender?: Sender): NftSale;
    static open(address: Address, sender?: Sender): NftSale;
    sendTopup(provider: ContractProvider, value: bigint, queryId?: bigint): Promise<void>;
    sendAdminMessage(provider: ContractProvider, params: {
        message: MessageRelaxed | Cell;
        sendMode: SendMode;
        queryId?: bigint;
        value: bigint;
    }): Promise<void>;
    sendCancel(provider: ContractProvider, value: bigint, queryId?: bigint): Promise<void>;
    sendBuy(provider: ContractProvider, value: bigint, queryId?: bigint): Promise<void>;
    sendDeployExternal(provider: ContractProvider): Promise<void>;
    getData(provider: ContractProvider): Promise<NftSaleData>;
}
