import { Contract, Address, Sender, Cell, ContractProvider } from "@ton/core";
import { JettonWallet } from "./JettonWallet";
import { ExtendedContractProvider } from "../ExtendedContractProvider";
import { JettonMintRequest, JettonMinterData } from "./data";
import { ContentResolver } from "../content";
export declare class Jetton implements Contract {
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
    static create(params: {
        admin: Address;
        content: Cell;
    }, sender?: Sender, contentResolver?: ContentResolver): Jetton;
    static open(address: Address, sender?: Sender, contentResolver?: ContentResolver): Jetton;
    getWalletAddress(provider: ContractProvider, owner: Address): Promise<Address>;
    getWallet(provider: ExtendedContractProvider, owner: Address): Promise<import("..").ExtendedOpenedContract<JettonWallet>>;
    getData(provider: ContractProvider): Promise<JettonMinterData>;
    getContent(provider: ContractProvider): Promise<import("../content").ParsedContent<import("./content").ParsedJettonContent>>;
    sendDeploy(provider: ContractProvider, value: bigint): Promise<void>;
    sendMint(provider: ContractProvider, request: JettonMintRequest): Promise<void>;
    sendChangeAdmin(provider: ContractProvider, params: {
        newAdmin: Address;
        value: bigint;
        queryId?: bigint;
    }): Promise<void>;
    sendChangeContent(provider: ContractProvider, params: {
        newContent: Cell;
        value: bigint;
        queryId?: bigint;
    }): Promise<void>;
}
