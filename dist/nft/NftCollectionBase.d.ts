import { Contract, Address, Sender, Cell, ContractProvider } from "@ton/core";
import { ExtendedContractProvider } from "../ExtendedContractProvider";
import { NftItem } from "./NftItem";
import { MintRequest, BatchMintRequest, NftCollectionData } from "./data";
import { ContentResolver } from "../content";
export declare abstract class NftCollectionBase<T> implements Contract {
    readonly address: Address;
    sender?: Sender | undefined;
    readonly init?: {
        code: Cell;
        data: Cell;
    } | undefined;
    readonly contentResolver?: ContentResolver | undefined;
    static code: Cell;
    constructor(address: Address, sender?: Sender | undefined, init?: {
        code: Cell;
        data: Cell;
    } | undefined, contentResolver?: ContentResolver | undefined);
    getItemAddress(provider: ContractProvider, index: bigint): Promise<Address>;
    getItem(provider: ExtendedContractProvider, index: bigint): Promise<import("..").ExtendedOpenedContract<NftItem>>;
    abstract paramsToCell(params: T): Cell;
    mintMessage(request: MintRequest<T>): Cell;
    batchMintMessage(request: BatchMintRequest<T>): Cell;
    sendMint(provider: ContractProvider, request: MintRequest<T>): Promise<void>;
    sendBatchMint(provider: ContractProvider, request: BatchMintRequest<T>): Promise<void>;
    sendDeploy(provider: ContractProvider, value: bigint): Promise<void>;
    sendChangeAdmin(provider: ContractProvider, params: {
        newAdmin: Address;
        value: bigint;
        queryId?: bigint;
    }): Promise<void>;
    sendChangeContent(provider: ContractProvider, params: {
        newContent: Cell;
        newRoyaltyParams: Cell;
        value: bigint;
        queryId?: bigint;
    }): Promise<void>;
    getData(provider: ContractProvider): Promise<NftCollectionData>;
    getContent(provider: ContractProvider): Promise<import("../content").ParsedContent<import("./content").ParsedNftContent>>;
    getItemContent(provider: ContractProvider, index: bigint, individualContent: Cell): Promise<Cell>;
}
