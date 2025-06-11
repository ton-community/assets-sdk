import { Address, Builder, Cell, Slice } from '@ton/core';

import { JETTON_INTERNAL_TRANSFER_OPCODE } from '../opcodes';

// internal_transfer  query_id:uint64 amount:(VarUInteger 16) from:MsgAddress
//                      response_address:MsgAddress
//                      forward_ton_amount:(VarUInteger 16)
//                      forward_payload:(Either Cell ^Cell)
//                      = InternalMsgBody;
export type JettonInternalTransferMessage = {
    queryId: bigint;
    amount: bigint;
    from: Address;
    responseAddress: Address | null;
    forwardTonAmount: bigint;
    forwardPayload: Cell | null;
};

export function storeJettonInternalTransferMessage(src: JettonInternalTransferMessage) {
    return (builder: Builder) => {
        builder.storeUint(JETTON_INTERNAL_TRANSFER_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.from);
        builder.storeAddress(src.responseAddress);
        builder.storeCoins(src.forwardTonAmount);
        builder.storeMaybeRef(src.forwardPayload);
    };
}

export function loadJettonInternalTransferMessage(slice: Slice): JettonInternalTransferMessage {
    if (slice.loadUint(32) !== JETTON_INTERNAL_TRANSFER_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const from = slice.loadAddress();
    const responseAddress = slice.loadAddress();
    const forwardTonAmount = slice.loadCoins();
    const eitherPayload = slice.loadBoolean();
    const forwardPayload = eitherPayload ? slice.loadRef() : slice.asCell();

    return {
        queryId,
        amount,
        from,
        responseAddress,
        forwardTonAmount,
        forwardPayload,
    };
}
