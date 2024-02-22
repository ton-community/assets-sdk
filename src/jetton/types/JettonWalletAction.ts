import {UnknownAction} from "../../common/types";
import {Address, Cell, Transaction} from "@ton/core";
import {loadJettonWalletMessage} from "./JettonWalletMessage";
import {parseTransferTransaction, TransferAction} from "../../common/types/TransferAction";

export type JettonWalletTransferAction = {
    kind: 'jetton_transfer';
    queryId: bigint;
    from: Address;
    to: Address;
    amount: bigint;
    responseAddress: Address | null;
    forwardTonAmount: bigint;
    forwardPayload: Cell | null;
}
export type JettonWalletTransferFailedAction = {
    kind: 'jetton_transfer_failed';
    queryId: bigint;
    amount: bigint;
}
export type JettonWalletBurnAction = {
    kind: 'jetton_burn';
    queryId: bigint;
    amount: bigint;
}
export type JettonWalletBurnFailedAction = {
    kind: 'jetton_burn_failed';
    queryId: bigint;
    amount: bigint;
}
export type JettonWalletAction =
    | JettonWalletTransferAction
    | JettonWalletTransferFailedAction
    | JettonWalletBurnAction
    | JettonWalletBurnFailedAction
    | TransferAction
    | UnknownAction;

export function parseJettonWalletTransaction(tx: Transaction): JettonWalletAction {
    const mayBeTransfer = parseTransferTransaction(tx);
    if (mayBeTransfer.kind !== 'unknown') {
        return mayBeTransfer;
    }

    if (tx.description.type !== 'generic') {
        return {kind: 'unknown', transaction: tx};
    }
    if (!tx.inMessage) {
        return {kind: 'unknown', transaction: tx};
    }
    if (tx.inMessage.info.type !== 'internal') {
        return {kind: 'unknown', transaction: tx};
    }
    if (tx.description.computePhase.type !== 'vm') {
        return {kind: 'unknown', transaction: tx};
    }
    if (!tx.inMessage.body) {
        return {kind: 'unknown', transaction: tx};
    }

    const isBounced = tx.inMessage.info.bounced;
    const inMessage = loadJettonWalletMessage(tx.inMessage.body.beginParse());

    if (inMessage.kind === 'jetton_transfer') {
        return {
            kind: 'jetton_transfer',
            queryId: inMessage.queryId,
            from: tx.inMessage.info.src,
            to: inMessage.to,
            amount: inMessage.amount,
            responseAddress: inMessage.responseDestination,
            forwardTonAmount: inMessage.forwardAmount,
            forwardPayload: inMessage.forwardPayload,
        };
    }

    if (isBounced && inMessage.kind === 'jetton_internal_transfer') {
        return {
            kind: 'jetton_transfer_failed',
            queryId: inMessage.queryId,
            amount: inMessage.amount
        };
    }

    if (inMessage.kind === 'jetton_burn') {
        return {
            kind: 'jetton_burn',
            queryId: inMessage.queryId,
            amount: inMessage.amount,
        };
    }

    if (isBounced && inMessage.kind === 'jetton_burn_notification') {
        return {
            kind: 'jetton_burn_failed',
            queryId: inMessage.queryId,
            amount: inMessage.amount,
        };
    }

    return {kind: 'unknown', transaction: tx};
}
