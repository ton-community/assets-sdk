import {Address, Builder, Slice} from "@ton/core";
import {JETTON_BURN_NOTIFICATION_OPCODE} from "../opcodes";

export type JettonBurnNotificationMessage = {
    queryId: bigint;
    amount: bigint;
    responseDestination: Address | null;
}

export function storeJettonBurnNotificationMessage(src: JettonBurnNotificationMessage) {
    return (builder: Builder) => {
        builder.storeUint(JETTON_BURN_NOTIFICATION_OPCODE, 32);
        builder.storeUint(src.queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.responseDestination);
    }
}

export function loadJettonBurnNotificationMessage(slice: Slice): JettonBurnNotificationMessage {
    if (slice.loadUint(32) !== JETTON_BURN_NOTIFICATION_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const responseDestination = slice.loadMaybeAddress();
    return {
        queryId,
        amount,
        responseDestination,
    };
}
