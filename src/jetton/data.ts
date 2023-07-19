import { Address, Cell } from "ton-core"

export interface TransferRequest {
    to: Address,
    amount: bigint,
    value?: bigint,
    queryId?: bigint,
    responseDestination?: Address,
    customPayload?: Cell,
    forwardAmount?: bigint,
    forwardPayload?: Cell,
}

export interface TransferBody {
    queryId: bigint,
    amount: bigint,
    destination: Address,
    responseDestination: Address,
    customPayload: Cell | null,
    forwardAmount: bigint,
    forwardPayload: Cell,
}

export type Transfer = TransferBody & {
    success: boolean,
    value: bigint,
}

export type MintRequest = Exclude<TransferRequest, 'customPayload'>

export interface BurnRequest {
    amount: bigint,
    value?: bigint,
    queryId?: bigint,
    responseDestination?: Address,
    customPayload?: Cell,
}

export interface RawJettonData {
    totalSupply: bigint,
    mintable: boolean,
    adminAddress: Address | null,
    jettonContent: Cell,
    jettonWalletCode: Cell,
}
