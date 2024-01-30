import { Contract, Address, Sender, ContractProvider, Cell, Slice, Transaction } from "@ton/core";
import { NftTransferRequest, NftItemData, NftTransferBody, NftTransfer } from "./data";
import { ContentResolver } from "../content";
import { ExtendedContractProvider } from "../ExtendedContractProvider";
export declare class NftItem implements Contract {
    readonly address: Address;
    sender?: Sender | undefined;
    contentResolver?: ContentResolver | undefined;
    static nftCode: Cell;
    static sbtCode: Cell;
    constructor(address: Address, sender?: Sender | undefined, contentResolver?: ContentResolver | undefined);
    sendTransfer(provider: ContractProvider, request: NftTransferRequest): Promise<void>;
    getData(provider: ContractProvider): Promise<NftItemData>;
    getContent(provider: ExtendedContractProvider): Promise<import("../content").ParsedContent<import("./content").ParsedNftContent>>;
    static parseTransferBody(body: Cell | Slice): NftTransferBody;
    static parseTransfer(tx: Transaction): NftTransfer;
}
