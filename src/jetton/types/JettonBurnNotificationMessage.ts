import { Address, Builder, Slice } from '@ton/core';

import { JETTON_BURN_NOTIFICATION_OPCODE } from '../opcodes';

// burn_notification query_id:uint64 amount:(VarUInteger 16)
//        sender:MsgAddress response_destination:MsgAddress
//        = InternalMsgBody;
export type JettonBurnNotificationMessage = {
    queryId: bigint;
    amount: bigint;
    sender: Address;
    responseDestination: Address | null;
};

export function storeJettonBurnNotificationMessage(src: JettonBurnNotificationMessage) {
    return (builder: Builder) => {
        builder.storeUint(JETTON_BURN_NOTIFICATION_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.sender);
        builder.storeAddress(src.responseDestination);
    };
}

export function loadJettonBurnNotificationMessage(slice: Slice): JettonBurnNotificationMessage {
    if (slice.loadUint(32) !== JETTON_BURN_NOTIFICATION_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const sender = slice.loadAddress();
    const responseDestination = slice.loadMaybeAddress();
    return {
        queryId,
        amount,
        sender,
        responseDestination,
    };
}
