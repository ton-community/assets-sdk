import { Address, Cell } from "ton-core"

export interface RequestCommon {
    to: Address,
    amount: bigint,
    queryId?: bigint,
    responseDestination?: Address,
    forwardAmount?: bigint,
    forwardPayload?: Cell,
}

export interface TransferRequest extends RequestCommon {
    value?: bigint,
    customPayload?: Cell,
}

export interface TransferBody {
    queryId: bigint,
    amount: bigint,
    destination: Address,
    responseDestination: Address | null,
    customPayload: Cell | null,
    forwardAmount: bigint,
    forwardPayload: Cell,
}

export interface Transfer extends TransferBody  {
    success: boolean,
    value: bigint,
}

export interface MintRequest extends RequestCommon {
    requestValue?: bigint,
    walletForwardValue?: bigint,
}

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
