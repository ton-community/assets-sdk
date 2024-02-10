import {Address, Cell} from "@ton/core"

interface JettonRequestCommon {
    to: Address,
    amount: bigint,
    queryId?: bigint,
    responseDestination?: Address,
    forwardAmount?: bigint,
    forwardPayload?: Cell,
}


export interface JettonMintRequest extends JettonRequestCommon {
    requestValue?: bigint,
    walletForwardValue?: bigint,
}


export interface JettonParams {
  onchainContent?: boolean;
  adminAddress?: Address;
  premint?: Exclude<JettonMintRequest, 'requestValue'>;
  value?: bigint;
}
