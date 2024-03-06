/// <reference types="node" />
import { SendMode, MessageRelaxed, Cell, SenderArguments } from "@ton/core";
import { ExtendedContractProvider } from "./ExtendedContractProvider";
export interface Wallet {
    createTransfer(args: {
        seqno: number;
        sendMode?: SendMode | null;
        secretKey: Buffer;
        messages: MessageRelaxed[];
        timeout?: number | null;
    }): Cell;
}
export declare function sendAndWait(wallet: Wallet, provider: ExtendedContractProvider, secretKey: Buffer, args: SenderArguments): Promise<void>;
