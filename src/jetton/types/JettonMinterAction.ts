import { Address, Cell, Transaction } from '@ton/core';

import { loadJettonMinterMessage } from './JettonMinterMessage';
import { UnknownAction } from '../../common/types';
import { parseTransferTransaction, TransferAction } from '../../common/types/TransferAction';

export type JettonMinterMintAction = {
    kind: 'mint';
    queryId: bigint;
    amount: bigint;
    recipient: Address;
    responseAddress: Address | null;
    forwardPayload: Cell | null;
    forwardTonAmount: bigint;
    value: bigint;
    transaction: Transaction;
};
export type JettonMinterBurnAction = {
    kind: 'burn';
    queryId: bigint;
    amount: bigint;
    from: Address;
    value: bigint;
    transaction: Transaction;
};
export type JettonMinterChangeAdminAction = {
    kind: 'change_admin';
    queryId: bigint;
    newAdmin: Address;
    value: bigint;
    transaction: Transaction;
};
export type JettonMinterChangeContentAction = {
    kind: 'change_content';
    queryId: bigint;
    newContent: Cell;
    value: bigint;
    transaction: Transaction;
};
export type JettonMinterAction =
    | JettonMinterMintAction
    | JettonMinterBurnAction
    | JettonMinterChangeAdminAction
    | JettonMinterChangeContentAction
    | TransferAction
    | UnknownAction;

export function parseJettonMinterTransaction(tx: Transaction): JettonMinterAction {
    const mayBeTransfer = parseTransferTransaction(tx);
    if (mayBeTransfer.kind !== 'unknown') {
        return mayBeTransfer;
    }

    if (tx.description.type !== 'generic') {
        return { kind: 'unknown', transaction: tx };
    }
    if (!tx.inMessage) {
        return { kind: 'unknown', transaction: tx };
    }
    if (tx.inMessage.info.type !== 'internal') {
        return { kind: 'unknown', transaction: tx };
    }
    if (tx.description.computePhase.type !== 'vm') {
        return { kind: 'unknown', transaction: tx };
    }
    if (tx.description.computePhase.exitCode !== 0) {
        return { kind: 'unknown', transaction: tx };
    }

    const inMessage = loadJettonMinterMessage(tx.inMessage.body.beginParse());

    if (inMessage.kind === 'mint') {
        return {
            kind: 'mint',
            queryId: inMessage.queryId,
            amount: inMessage.amount,
            recipient: inMessage.to,
            responseAddress: inMessage.responseAddress,
            forwardPayload: inMessage.forwardPayload,
            forwardTonAmount: inMessage.forwardTonAmount,
            value: tx.inMessage.info.value.coins,
            transaction: tx,
        };
    }

    if (inMessage.kind === 'internal_transfer') {
        return {
            kind: 'burn',
            queryId: inMessage.queryId,
            amount: inMessage.amount,
            from: inMessage.from,
            value: tx.inMessage.info.value.coins,
            transaction: tx,
        };
    }

    if (inMessage.kind === 'change_admin') {
        return {
            kind: 'change_admin',
            queryId: inMessage.queryId,
            newAdmin: inMessage.newAdmin,
            value: tx.inMessage.info.value.coins,
            transaction: tx,
        };
    }

    if (inMessage.kind === 'change_content') {
        return {
            kind: 'change_content',
            queryId: inMessage.queryId,
            newContent: inMessage.newContent,
            value: tx.inMessage.info.value.coins,
            transaction: tx,
        };
    }

    return { kind: 'unknown', transaction: tx };
}
