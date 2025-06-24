import { Slice } from '@ton/core';

import { ParamsValue } from '../../common/types/ParamsValue';
import { NFT_BATCH_MINT_OPCODE, NFT_CHANGE_ADMIN_OPCODE, NFT_CHANGE_CONTENT_OPCODE, NFT_MINT_OPCODE } from '../opcodes';
import { loadNftMintMessage, NftMintMessage } from './NftMintMessage';
import { loadNftBatchMintMessage, NftBatchMintMessage } from './NftBatchMintMessage';
import { loadNftChangeAdminMessage, NftChangeAdminMessage } from './NftChangeAdminMessage';
import { loadNftChangeContentMessage, NftChangeContentMessage } from './NftChangeContentMessage';
import { SetKind, UnknownMessage } from '../../common/types';

export type NftCollectionMessage<T> =
    | SetKind<NftMintMessage<T>, 'mint'>
    | SetKind<NftBatchMintMessage<T>, 'mint_batch'>
    | SetKind<NftChangeAdminMessage, 'change_admin'>
    | SetKind<NftChangeContentMessage, 'change_content'>
    | SetKind<UnknownMessage, 'unknown'>;

export function loadNftCollectionMessage<T>(slice: Slice, paramsValue: ParamsValue<T>): NftCollectionMessage<T> {
    try {
        const op = slice.preloadUint(32);
        switch (op) {
            case NFT_MINT_OPCODE: {
                return { kind: 'mint', ...loadNftMintMessage(slice, paramsValue.load) };
            }
            case NFT_BATCH_MINT_OPCODE: {
                return { kind: 'mint_batch', ...loadNftBatchMintMessage(slice, paramsValue.load) };
            }
            case NFT_CHANGE_ADMIN_OPCODE: {
                return { kind: 'change_admin', ...loadNftChangeAdminMessage(slice) };
            }
            case NFT_CHANGE_CONTENT_OPCODE: {
                return { kind: 'change_content', ...loadNftChangeContentMessage(slice) };
            }
        }
        // eslint-disable-next-line no-empty
    } catch (_) {}

    return { kind: 'unknown' };
}
