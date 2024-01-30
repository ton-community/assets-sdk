/// <reference types="node" />
import { Contract, Address, Cell, SendMode, MessageRelaxed, ContractProvider } from "@ton/core";
export declare class HighloadWalletV2 implements Contract {
    readonly address: Address;
    readonly init?: {
        code: Cell;
        data: Cell;
    } | undefined;
    readonly walletId: number;
    static code: Cell;
    constructor(address: Address, init?: {
        code: Cell;
        data: Cell;
    } | undefined, walletId?: number);
    static create(params: {
        workchain: number;
        publicKey: Buffer;
        walletId?: number;
    }): HighloadWalletV2;
    static createFromAddress(address: Address): HighloadWalletV2;
    static makeQueryId(timeout?: number | null, seqno?: number | null): bigint;
    private _createTransfer;
    createTransfer(args: {
        seqno?: number | null;
        sendMode?: SendMode | null;
        secretKey: Buffer;
        messages: MessageRelaxed[];
        timeout?: number | null;
    }): Cell;
    sendTransfer(provider: ContractProvider, args: {
        seqno?: number | null;
        sendMode?: SendMode | null;
        secretKey: Buffer;
        messages: MessageRelaxed[];
        timeout?: number | null;
    }): Promise<void>;
    getProcessedStatus(provider: ContractProvider, arg: bigint | {
        timeout: number;
        seqno: number;
    }): Promise<"processed" | "unprocessed" | "forgotten">;
    getPublicKey(provider: ContractProvider): Promise<Buffer>;
    sendTransferAndWait(provider: ContractProvider, args: {
        seqno?: number | null;
        sendMode?: SendMode | null;
        secretKey: Buffer;
        messages: MessageRelaxed[];
        timeout?: number | null;
    }, sleepInterval?: number): Promise<void>;
}
