import { Address, Cell, Transaction } from '@ton/core';

import { UnknownAction } from '../../common/types';
import { loadNftCollectionMessage } from './NftCollectionMessage';
import { createNftItemParamsValue } from './NftItemParams';
import { NftRoyaltyParams } from './NftRoyaltyParams';
import { parseTransferTransaction, TransferAction } from '../../common/types/TransferAction';

export type NftMintItemAction = {
    kind: 'mint';
    queryId: bigint;
    index: bigint;
    owner: Address;
    content: Cell;
    transaction: Transaction;
};
export type NftMintBatchAction = {
    kind: 'mint_batch';
    queryId: bigint;
    items: {
        index: bigint;
        owner: Address;
        content: Cell;
    }[];
    transaction: Transaction;
};
export type NftCollectionChangeAdminAction = {
    kind: 'change_owner';
    queryId: bigint;
    newOwner: Address;
    transaction: Transaction;
};
export type NftCollectionChangeContentAction = {
    kind: 'change_content';
    queryId: bigint;
    newContent: Cell;
    newRoyalty: NftRoyaltyParams;
    transaction: Transaction;
};
export type NftCollectionAction =
    | NftMintItemAction
    | NftMintBatchAction
    | NftCollectionChangeAdminAction
    | NftCollectionChangeContentAction
    | TransferAction
    | UnknownAction;

export function parseNftCollectionTransaction(tx: Transaction): NftCollectionAction {
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

    const inMessage = loadNftCollectionMessage(tx.inMessage.body.beginParse(), createNftItemParamsValue());

    if (inMessage.kind === 'mint') {
        return {
            kind: 'mint',
            queryId: inMessage.queryId,
            index: inMessage.itemIndex,
            owner: inMessage.itemParams.owner,
            content: inMessage.itemParams.individualContent as Cell,
            transaction: tx,
        };
    }

    if (inMessage.kind === 'mint_batch') {
        return {
            kind: 'mint_batch',
            queryId: inMessage.queryId,
            items: inMessage.requests.map((item) => ({
                index: item.index,
                owner: item.params.owner,
                content: item.params.individualContent as Cell,
            })),
            transaction: tx,
        };
    }

    if (inMessage.kind === 'change_admin') {
        return {
            kind: 'change_owner',
            queryId: inMessage.queryId,
            newOwner: inMessage.newAdmin,
            transaction: tx,
        };
    }

    if (inMessage.kind === 'change_content') {
        return {
            kind: 'change_content',
            queryId: inMessage.queryId,
            newContent: inMessage.newContent,
            newRoyalty: inMessage.newRoyaltyParams,
            transaction: tx,
        };
    }

    return { kind: 'unknown', transaction: tx };
}
