import { Address, Cell, Sender } from "@ton/core";
import { NftCollectionBase } from "./NftCollectionBase";
import { SbtItemParams } from "./data";
import { ContentResolver } from "../content";
export declare class SbtCollection extends NftCollectionBase<SbtItemParams> {
    static create(params: {
        admin: Address;
        content: Cell;
        royalty?: {
            numerator: number;
            denominator: number;
            recipient?: Address;
        };
    }, sender?: Sender, contentResolver?: ContentResolver): SbtCollection;
    static open(address: Address, sender?: Sender, contentResolver?: ContentResolver): SbtCollection;
    paramsToCell(params: SbtItemParams): Cell;
}
