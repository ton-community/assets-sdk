import { Address, Cell, Transaction } from '@ton/core';

import { UnknownAction } from '../../common/types';
import { NftRoyaltyParams } from './NftRoyaltyParams';
import { createSbtItemParamsValue } from './SbtItemParams';
import { loadNftCollectionMessage } from './NftCollectionMessage';

export type SbtMintItemAction = {
    kind: 'mint';
    index: bigint;
    owner: Address;
    content: Cell;
    authority: Address | null;
    transaction: Transaction;
};

export type SbtMintBatchAction = {
    kind: 'mint_batch';
    items: {
        index: bigint;
        owner: Address;
        content: Cell;
        authority: Address | null;
    }[];
    transaction: Transaction;
};

export type SbtCollectionChangeAdminAction = {
    kind: 'change_owner';
    newOwner: Address;
    transaction: Transaction;
};

export type SbtCollectionChangeContentAction = {
    kind: 'change_content';
    newContent: Cell;
    newRoyalty: NftRoyaltyParams;
    transaction: Transaction;
};

export type SbtCollectionAction =
    | SbtMintItemAction
    | SbtMintBatchAction
    | SbtCollectionChangeAdminAction
    | SbtCollectionChangeContentAction
    | UnknownAction;

export function parseSbtCollectionTransaction(tx: Transaction): SbtCollectionAction {
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

    const inMessage = loadNftCollectionMessage(tx.inMessage.body.beginParse(), createSbtItemParamsValue());

    if (inMessage.kind === 'mint') {
        return {
            kind: 'mint',
            index: inMessage.itemIndex,
            owner: inMessage.itemParams.owner,
            content: inMessage.itemParams.individualContent as Cell,
            authority: inMessage.itemParams.authority,
            transaction: tx,
        };
    }

    if (inMessage.kind === 'mint_batch') {
        return {
            kind: 'mint_batch',
            items: inMessage.requests.map((item) => ({
                index: item.index,
                owner: item.params.owner,
                content: item.params.individualContent as Cell,
                authority: item.params.authority,
            })),
            transaction: tx,
        };
    }

    if (inMessage.kind === 'change_admin') {
        return {
            kind: 'change_owner',
            newOwner: inMessage.newAdmin,
            transaction: tx,
        };
    }

    if (inMessage.kind === 'change_content') {
        return {
            kind: 'change_content',
            newContent: inMessage.newContent,
            newRoyalty: inMessage.newRoyaltyParams,
            transaction: tx,
        };
    }

    return { kind: 'unknown', transaction: tx };
}
