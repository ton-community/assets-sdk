import {Address, Builder, Cell, Slice} from "@ton/core";
import {JETTON_BURN_OPCODE} from "../opcodes";

// burn#595f07bc query_id:uint64 amount:(VarUInteger 16)
//               response_destination:MsgAddress custom_payload:(Maybe ^Cell)
//               = InternalMsgBody;
export type JettonBurnMessage = {
    queryId: bigint;
    amount: bigint;
    responseDestination: Address | null;
    customPayload: Cell | null;
}

export function storeJettonBurnMessage(src: JettonBurnMessage) {
    return (builder: Builder) => {
        builder.storeUint(JETTON_BURN_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.responseDestination);
        builder.storeMaybeRef(src.customPayload);
    }
}

export function loadJettonBurnMessage(slice: Slice): JettonBurnMessage {
    if (slice.loadUint(32) !== JETTON_BURN_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const responseDestination = slice.loadMaybeAddress();
    const customPayload = slice.loadMaybeRef();
    return {
        queryId,
        amount,
        responseDestination,
        customPayload,
    };
}
