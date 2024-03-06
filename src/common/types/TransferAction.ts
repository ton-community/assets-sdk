import {Address, Transaction} from "@ton/core";
import {UnknownAction} from "../types";
import {loadTransferMessage} from "./TransferMessage";

export type SimpleTransferAction = {
    kind: 'simple_transfer',
    from: Address,
    to: Address,
    amount: bigint,
    transaction: Transaction,
};

export type TextAction = {
    kind: 'text_message',
    from: Address,
    to: Address,
    amount: bigint,
    text: string,
    transaction: Transaction,
};

export type EncryptedAction = {
    kind: 'encrypted_message',
    from: Address,
    to: Address,
    amount: bigint,
    data: Buffer,
    transaction: Transaction,
};

export type TransferAction =
    | SimpleTransferAction
    | TextAction
    | EncryptedAction
    | UnknownAction;

export function parseTransferTransaction(tx: Transaction): TransferAction {
    if (tx.description.type !== 'generic') {
        return {kind: 'unknown', transaction: tx};
    }
    if (!tx.inMessage) {
        return {kind: 'unknown', transaction: tx};
    }
    if (tx.inMessage.info.type !== 'internal') {
        return {kind: 'unknown', transaction: tx};
    }

    const body = tx.inMessage.body.beginParse();
    const inMessage = loadTransferMessage(body);

    if (inMessage.kind === 'simple_transfer') {
        return {
            kind: 'simple_transfer',
            from: tx.inMessage.info.src,
            to: tx.inMessage.info.dest,
            amount: tx.inMessage.info.value.coins,
            transaction: tx,
        };
    }

    if (inMessage.kind === 'text_message') {
        return {
            kind: 'text_message',
            from: tx.inMessage.info.src,
            to: tx.inMessage.info.dest,
            amount: tx.inMessage.info.value.coins,
            text: inMessage.text,
            transaction: tx,
        };
    }

    if (inMessage.kind === 'encrypted_message') {
        return {
            kind: 'encrypted_message',
            from: tx.inMessage.info.src,
            to: tx.inMessage.info.dest,
            amount: tx.inMessage.info.value.coins,
            data: inMessage.data,
            transaction: tx,
        };
    }

    return {kind: 'unknown', transaction: tx};
}
