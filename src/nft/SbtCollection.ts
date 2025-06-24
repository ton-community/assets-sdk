import { Address, beginCell, Cell, contractAddress, ContractProvider } from '@ton/core';

import { NftCollectionBase } from './NftCollectionBase';
import { ContentResolver } from '../content';
import { SbtItem } from './SbtItem';
import { parseSbtCollectionTransaction, SbtCollectionAction } from './types/SbtCollectionAction';
import { PartialBy } from '../utils';
import { NftCollectionData, storeNftCollectionData } from './types/NftCollectionData';
import { createSbtItemParamsValue, SbtItemParams } from './types/SbtItemParams';

export type SbtCollectionConfig = Omit<PartialBy<NftCollectionData, 'itemCode'>, 'royalty'>;

export function sbtCollectionConfigToCell(config: SbtCollectionConfig): Cell {
    return beginCell()
        .store(
            storeNftCollectionData({
                admin: config.admin,
                content: config.content,
                itemCode: config.itemCode ?? SbtItem.sbtCode,
                royalty: {
                    numerator: 0n,
                    denominator: 1n,
                    recipient: config.admin,
                },
            }),
        )
        .endCell();
}

export class SbtCollection extends NftCollectionBase<SbtItemParams> {
    static createFromConfig(
        config: SbtCollectionConfig,
        code?: Cell,
        workchain?: number,
        contentResolver?: ContentResolver,
    ) {
        const data = sbtCollectionConfigToCell(config);
        const init = { data, code: code ?? SbtCollection.code };
        return new SbtCollection(
            contractAddress(workchain ?? 0, init),
            init,
            contentResolver,
            createSbtItemParamsValue(),
        );
    }

    static createFromAddress(address: Address, contentResolver?: ContentResolver) {
        return new SbtCollection(address, undefined, contentResolver, createSbtItemParamsValue());
    }

    async getItem(provider: ContractProvider, index: bigint) {
        const nftItemAddress = await this.getItemAddress(provider, index);
        return provider.open(new SbtItem(nftItemAddress, undefined, this.contentResolver));
    }

    async getActions(
        provider: ContractProvider,
        options?:
            | { lt?: never; hash?: never; limit?: number }
            | {
                  lt: bigint;
                  hash: Buffer;
                  limit?: number;
              },
    ): Promise<SbtCollectionAction[]> {
        let { lt, hash, limit } = options ?? {};
        if (!lt || !hash) {
            const state = await provider.getState();
            if (!state.last) {
                return [];
            }

            lt = state.last.lt;
            hash = state.last.hash;
        }

        const messages = await provider.getTransactions(this.address, lt, hash, limit);
        return messages.map((tx) => parseSbtCollectionTransaction(tx));
    }
}
