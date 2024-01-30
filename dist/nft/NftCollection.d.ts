import { Address, Cell, Sender } from "@ton/core";
import { NftCollectionBase } from "./NftCollectionBase";
import { NftItemParams } from "./data";
import { ContentResolver } from "../content";
export declare class NftCollection extends NftCollectionBase<NftItemParams> {
    static create(params: {
        admin: Address;
        content: Cell;
        royalty?: {
            numerator: number;
            denominator: number;
            recipient?: Address;
        };
    }, sender?: Sender, contentResolver?: ContentResolver): NftCollection;
    static open(address: Address, sender?: Sender, contentResolver?: ContentResolver): NftCollection;
    paramsToCell(params: NftItemParams): Cell;
}
