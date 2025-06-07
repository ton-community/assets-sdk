import { Address, Cell, Transaction } from '@ton/core';

import { UnknownAction } from '../../common/types';
import { loadNftMessage } from './NftMessage';
import { parseTransferTransaction, TransferAction } from '../../common/types/TransferAction';

export type NftTransferAction = {
    kind: 'nft_transfer';
    queryId: bigint;
    newOwner: Address;
    customPayload: Cell | null;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
    transaction: Transaction;
};
export type NftDeployAction = {
    kind: 'deploy';
    owner: Address;
    content: Cell;
    collection: Address;
    transaction: Transaction;
};
export type NftItemAction = NftTransferAction | NftDeployAction | TransferAction | UnknownAction;

export function parseNftItemTransaction(tx: Transaction): NftItemAction {
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

    const inMessage = loadNftMessage(tx.inMessage.body.beginParse());

    if (inMessage.kind === 'nft_deploy') {
        return {
            kind: 'deploy',
            owner: inMessage.owner,
            content: inMessage.content,
            collection: tx.inMessage.info.src,
            transaction: tx,
        };
    }

    if (inMessage.kind === 'nft_transfer') {
        return {
            kind: 'nft_transfer',
            queryId: inMessage.queryId,
            newOwner: inMessage.newOwner,
            customPayload: inMessage.customPayload ?? null,
            forwardAmount: inMessage.forwardAmount,
            forwardPayload: inMessage.forwardPayload ?? null,
            transaction: tx,
        };
    }

    return { kind: 'unknown', transaction: tx };
}
