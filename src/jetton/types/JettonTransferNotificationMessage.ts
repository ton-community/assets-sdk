import { Address, Builder, Cell, Slice } from '@ton/core';

import { JETTON_TRANSFER_NOTIFICATION_OPCODE } from '../opcodes';

// transfer_notification#7362d09c query_id:uint64 amount:(VarUInteger 16)
//                               sender:MsgAddress forward_payload:(Either Cell ^Cell)
//                               = InternalMsgBody;
export type JettonTransferNotificationMessage = {
    queryId: bigint;
    amount: bigint;
    sender: Address;
    forwardPayload: Cell | null;
};

export function storeJettonTransferNotificationMessage(
    src: JettonTransferNotificationMessage,
): (builder: Builder) => void {
    return (builder: Builder) => {
        builder.storeUint(JETTON_TRANSFER_NOTIFICATION_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.sender);
        builder.storeMaybeRef(src.forwardPayload);
    };
}

export function loadJettonTransferNotificationMessage(slice: Slice): JettonTransferNotificationMessage {
    if (slice.loadUint(32) !== JETTON_TRANSFER_NOTIFICATION_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const sender = slice.loadAddress();
    const eitherPayload = slice.loadBoolean();
    const forwardPayload = eitherPayload ? slice.loadRef() : slice.asCell();

    return {
        queryId,
        amount,
        sender,
        forwardPayload,
    };
}
