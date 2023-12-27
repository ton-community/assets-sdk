import { Address, Cell, Sender, beginCell, contractAddress } from "@ton/core";
import { NftCollectionBase } from "./NftCollectionBase";
import { NftItemParams } from "./data";
import { NftItem } from "./NftItem";
import { ContentResolver } from "../content";

function nftItemParamsToCell(params: NftItemParams): Cell {
    return beginCell()
        .storeAddress(params.owner)
        .storeRef(typeof params.individualContent === 'string' ? beginCell().storeStringTail(params.individualContent) : params.individualContent)
        .endCell();
}

export class NftCollection extends NftCollectionBase<NftItemParams> {
    static create(params: {
        admin: Address,
        content: Cell,
        royalty?: {
            numerator: number,
            denominator: number,
            recipient?: Address,
        },
    }, sender?: Sender, contentResolver?: ContentResolver) {
        const data = beginCell()
            .storeAddress(params.admin)
            .storeUint(0, 64)
            .storeRef(params.content)
            .storeRef(NftItem.nftCode)
            .storeRef(beginCell()
                .storeUint(params.royalty?.numerator ?? 0, 16)
                .storeUint(params.royalty?.denominator ?? 1, 16)
                .storeAddress(params.royalty?.recipient ?? params.admin))
            .endCell();
        const init = { data, code: NftCollection.code };
        return new NftCollection(contractAddress(0, init), sender, init, contentResolver);
    }

    static open(address: Address, sender?: Sender, contentResolver?: ContentResolver) {
        return new NftCollection(address, sender, undefined, contentResolver);
    }

    paramsToCell(params: NftItemParams): Cell {
        return nftItemParamsToCell(params);
    }
}
