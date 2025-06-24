import { Slice } from '@ton/core';

import { SetKind, UnknownMessage } from '../../common/types';
import { JettonMintMessage, loadJettonMintMessage } from './JettonMintMessage';
import { JettonInternalTransferMessage, loadJettonInternalTransferMessage } from './JettonInternalTransferMessage';
import { JettonChangeAdminMessage, loadJettonChangeAdminMessage } from './JettonChangeAdminMessage';
import { JettonChangeContentMessage, loadJettonChangeContentMessage } from './JettonChangeContentMessage';
import {
    JETTON_CHANGE_ADMIN_OPCODE,
    JETTON_CHANGE_CONTENT_OPCODE,
    JETTON_INTERNAL_TRANSFER_OPCODE,
    JETTON_MINT_OPCODE,
} from '../opcodes';
import { TransferMessage } from '../../common/types/TransferMessage';

export type JettonMinterMessage =
    | SetKind<JettonMintMessage, 'mint'>
    | SetKind<JettonInternalTransferMessage, 'internal_transfer'>
    | SetKind<JettonChangeAdminMessage, 'change_admin'>
    | SetKind<JettonChangeContentMessage, 'change_content'>
    | SetKind<UnknownMessage, 'unknown'>
    | TransferMessage;

export function loadJettonMinterMessage(slice: Slice): JettonMinterMessage {
    try {
        const opcode = slice.preloadUint(32);
        switch (opcode) {
            case JETTON_MINT_OPCODE:
                return { kind: 'mint', ...loadJettonMintMessage(slice) };
            case JETTON_INTERNAL_TRANSFER_OPCODE:
                return { kind: 'internal_transfer', ...loadJettonInternalTransferMessage(slice) };
            case JETTON_CHANGE_ADMIN_OPCODE:
                return { kind: 'change_admin', ...loadJettonChangeAdminMessage(slice) };
            case JETTON_CHANGE_CONTENT_OPCODE:
                return { kind: 'change_content', ...loadJettonChangeContentMessage(slice) };
        }
        // eslint-disable-next-line no-empty
    } catch (_) {}

    return { kind: 'unknown' };
}
