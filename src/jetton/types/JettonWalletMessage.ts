import {Slice} from "@ton/core";
import {
    JETTON_BURN_NOTIFICATION_OPCODE,
    JETTON_BURN_OPCODE,
    JETTON_INTERNAL_TRANSFER_OPCODE,
    JETTON_TRANSFER_OPCODE
} from "../opcodes";
import {JettonTransferMessage, loadJettonTransferMessage} from "./JettonTransferMessage";
import {JettonInternalTransferMessage, loadJettonInternalTransferMessage} from "./JettonInternalTransferMessage";
import {JettonBurnMessage, loadJettonBurnMessage} from "./JettonBurnMessage";
import {JettonBurnNotificationMessage, loadJettonBurnNotificationMessage} from "./JettonBurnNotificationMessage";
import {SetKind, UnknownMessage} from "../../common/types";

export type JettonWalletMessage =
    | SetKind<JettonInternalTransferMessage, 'jetton_internal_transfer'>
    | SetKind<JettonTransferMessage, 'jetton_transfer'>
    | SetKind<JettonBurnMessage, 'jetton_burn'>
    | SetKind<JettonBurnNotificationMessage, 'jetton_burn_notification'>
    | SetKind<UnknownMessage, 'unknown'>;

export function loadJettonWalletMessage(slice: Slice): JettonWalletMessage {
    try {
        const opcode = slice.preloadUint(32);
        switch (opcode) {
            case JETTON_TRANSFER_OPCODE:
                return {kind: 'jetton_transfer', ...loadJettonTransferMessage(slice)};
            case JETTON_INTERNAL_TRANSFER_OPCODE:
                return {kind: 'jetton_internal_transfer', ...loadJettonInternalTransferMessage(slice)};
            case JETTON_BURN_OPCODE:
                return {kind: 'jetton_burn', ...loadJettonBurnMessage(slice)};
            case JETTON_BURN_NOTIFICATION_OPCODE:
                return {kind: 'jetton_burn_notification', ...loadJettonBurnNotificationMessage(slice)};
        }
    } catch (e) {}

    return {kind: 'unknown'};
}
