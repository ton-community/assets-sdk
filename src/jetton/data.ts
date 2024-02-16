import {Address, Cell} from "@ton/core"

export interface JettonMintRequest {
    to: Address,
    amount: bigint,
    queryId?: bigint,
    responseDestination?: Address,
    forwardAmount?: bigint,
    forwardPayload?: Cell,
    requestValue?: bigint,
    walletForwardValue?: bigint,
}


export interface JettonParams {
  adminAddress?: Address;
  premint?: Exclude<JettonMintRequest, 'requestValue'>;
}
