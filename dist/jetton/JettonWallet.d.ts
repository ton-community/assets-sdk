import { Contract, Address, Sender, ContractProvider, Cell, Slice, Transaction } from "@ton/core";
import { JettonWalletData, JettonTransferRequest, JettonBurnRequest, JettonTransferBody, JettonTransfer } from "./data";
export declare class JettonWallet implements Contract {
    readonly address: Address;
    sender?: Sender | undefined;
    static code: Cell;
    constructor(address: Address, sender?: Sender | undefined);
    getData(provider: ContractProvider): Promise<JettonWalletData>;
    sendTransfer(provider: ContractProvider, request: JettonTransferRequest): Promise<void>;
    sendBurn(provider: ContractProvider, request: JettonBurnRequest): Promise<void>;
    static parseTransferBody(body: Cell | Slice): JettonTransferBody;
    static parseTransfer(tx: Transaction): JettonTransfer;
}
