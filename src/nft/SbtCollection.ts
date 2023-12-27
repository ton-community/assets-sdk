import { Address, Cell, Sender, beginCell, contractAddress } from "@ton/core";
import { NftCollectionBase } from "./NftCollectionBase";
import { SbtItemParams } from "./data";
import { NftItem } from "./NftItem";
import { ContentResolver } from "../content";

function sbtItemParamsToCell(params: SbtItemParams): Cell {
    return beginCell()
        .storeAddress(params.owner)
        .storeRef(typeof params.individualContent === 'string' ? beginCell().storeStringTail(params.individualContent) : params.individualContent)
        .storeAddress(params.authority)
        .endCell();
}

export class SbtCollection extends NftCollectionBase<SbtItemParams> {
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
            .storeRef(NftItem.sbtCode)
            .storeRef(beginCell()
                .storeUint(params.royalty?.numerator ?? 0, 16)
                .storeUint(params.royalty?.denominator ?? 1, 16)
                .storeAddress(params.royalty?.recipient ?? params.admin))
            .endCell();
        const init = { data, code: SbtCollection.code };
        return new SbtCollection(contractAddress(0, init), sender, init, contentResolver);
    }

    static open(address: Address, sender?: Sender, contentResolver?: ContentResolver) {
        return new SbtCollection(address, sender, undefined, contentResolver);
    }

    paramsToCell(params: SbtItemParams): Cell {
        return sbtItemParamsToCell(params);
    }
}
