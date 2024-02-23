import {Address, Builder, Cell, Slice} from "@ton/core";
import {JETTON_TRANSFER_OPCODE} from "../opcodes";

// transfer#0f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
//                  response_destination:MsgAddress custom_payload:(Maybe ^Cell)
//                  forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
//                  = InternalMsgBody;
export interface JettonTransferMessage {
    queryId: bigint;
    amount: bigint;
    destination: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
}

export function storeJettonTransferMessage(src: JettonTransferMessage) {
    return (builder: Builder) => {
        builder.storeUint(JETTON_TRANSFER_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.destination);
        builder.storeAddress(src.responseDestination);
        builder.storeMaybeRef(src.customPayload);
        builder.storeCoins(src.forwardAmount ?? 0);
        builder.storeMaybeRef(src.forwardPayload);
    };
}

export function loadJettonTransferMessage(slice: Slice): JettonTransferMessage {
    if (slice.loadUint(32) !== JETTON_TRANSFER_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const to = slice.loadAddress();
    const responseDestination = slice.loadMaybeAddress();
    const customPayload = slice.loadMaybeRef();
    const forwardAmount = slice.loadCoins();
    const eitherPayload = slice.loadBoolean();
    const forwardPayload = eitherPayload ? slice.loadRef() : slice.asCell();

    return {
        queryId,
        amount,
        destination: to,
        responseDestination,
        customPayload,
        forwardAmount,
        forwardPayload,
    };
}
