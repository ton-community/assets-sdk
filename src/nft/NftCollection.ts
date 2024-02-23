import {Address, beginCell, Cell, contractAddress, ContractProvider} from "@ton/core";
import {NftCollectionBase} from "./NftCollectionBase";
import {NftItem} from "./NftItem";
import {ContentResolver} from "../content";
import {PartialBy} from "../utils";
import {NftRoyaltyParams} from "./types/NftRoyaltyParams";
import {NftCollectionData, storeNftCollectionData} from "./types/NftCollectionData";
import {createNftItemParamsValue, NftItemParams} from "./types/NftItemParams";
import {NftCollectionAction, parseNftCollectionTransaction} from "./types/NftCollectionAction";

export type NftCollectionConfig = PartialBy<NftCollectionData, 'itemCode' | 'royalty'>;

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    return beginCell().store(storeNftCollectionData({
        admin: config.admin,
        content: config.content,
        itemCode: config.itemCode ?? NftItem.nftCode,
        royalty: {
            numerator: config.royalty?.numerator ?? 0n,
            denominator: config.royalty?.denominator ?? 1n,
            recipient: config.royalty?.recipient ?? config.admin,
        },
    })).endCell();
}

export class NftCollection extends NftCollectionBase<NftItemParams> {
    static createFromConfig(config: NftCollectionConfig, code?: Cell, workchain?: number, contentResolver?: ContentResolver) {
        const data = nftCollectionConfigToCell(config);
        const init = {data, code: code ?? NftCollectionBase.code};
        return new NftCollection(contractAddress(workchain ?? 0, init), init, contentResolver, createNftItemParamsValue());
    }

    static createFromAddress(address: Address, contentResolver?: ContentResolver) {
        return new NftCollection(address, undefined, contentResolver, createNftItemParamsValue());
    }

    async getItem(provider: ContractProvider, index: bigint) {
        const nftItemAddress = await this.getItemAddress(provider, index);
        return provider.open(new NftItem(nftItemAddress, undefined, this.contentResolver));
    }

    async getRoyaltyParams(provider: ContractProvider): Promise<NftRoyaltyParams> {
        const {stack} = await provider.get('royalty_params', []);
        return {
            numerator: stack.readBigNumber(),
            denominator: stack.readBigNumber(),
            recipient: stack.readAddress(),
        };
    }

    async getActions(provider: ContractProvider, options?: { lt?: never, hash?: never, limit?: number } | {
        lt: bigint,
        hash: Buffer,
        limit?: number
    }): Promise<NftCollectionAction[]> {
        let {lt, hash, limit} = options ?? {};
        if (!lt || !hash) {
            const state = await provider.getState();
            if (!state.last) {
                return [];
            }

            lt = state.last.lt;
            hash = state.last.hash;
        }

        const messages = await provider.getTransactions(this.address, lt, hash, limit);
        return messages.map(tx => parseNftCollectionTransaction(tx));
    }
}
