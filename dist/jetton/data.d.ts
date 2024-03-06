import { Address, Cell } from "@ton/core";
interface JettonRequestCommon {
    to: Address;
    amount: bigint;
    queryId?: bigint;
    responseDestination?: Address;
    forwardAmount?: bigint;
    forwardPayload?: Cell;
}
export interface JettonTransferRequest extends JettonRequestCommon {
    value?: bigint;
    customPayload?: Cell;
}
export interface JettonTransferBody {
    queryId: bigint;
    amount: bigint;
    destination: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
    forwardAmount: bigint;
    forwardPayload: Cell;
}
export interface JettonTransfer extends JettonTransferBody {
    success: boolean;
    value: bigint;
}
export interface JettonMintRequest extends JettonRequestCommon {
    requestValue?: bigint;
    walletForwardValue?: bigint;
}
export interface JettonBurnRequest {
    amount: bigint;
    value?: bigint;
    queryId?: bigint;
    responseDestination?: Address;
    customPayload?: Cell;
}
export interface JettonMinterData {
    totalSupply: bigint;
    mintable: boolean;
    adminAddress: Address | null;
    jettonContent: Cell;
    jettonWalletCode: Cell;
}
export interface JettonWalletData {
    balance: bigint;
    owner: Address;
    jetton: Address;
    code: Cell;
}
export {};
