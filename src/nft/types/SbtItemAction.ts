import { Address, Cell, Transaction } from '@ton/core';

import { loadNftMessage } from './NftMessage';
import { UnknownAction } from '../../common/types';
import { parseTransferTransaction, TransferAction } from '../../common/types/TransferAction';

export type SbtDeployAction = {
    kind: 'sbt_deploy';
    owner: Address;
    content: Cell;
    collection: Address;
    transaction: Transaction;
};
export type SbtItemAction = SbtDeployAction | TransferAction | UnknownAction;

export function parseSbtItemTransaction(tx: Transaction): SbtItemAction {
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
            kind: 'sbt_deploy',
            owner: inMessage.owner,
            content: inMessage.content,
            collection: tx.inMessage.info.src,
            transaction: tx,
        };
    }

    return { kind: 'unknown', transaction: tx };
}
