import {Address, beginCell, Builder, Cell, Slice} from "@ton/core";
import {ParamsValue} from "../../common/types/ParamsValue";

export type NftItemParams = {
    owner: Address;
    individualContent: Cell | string;
};
export type NftItemParamsValue = ParamsValue<NftItemParams>;

export function storeNftItemParams(src: NftItemParams) {
    return (builder: Builder) => {
        builder.storeAddress(src.owner);
        if (typeof src.individualContent === 'string') {
            builder.storeRef(beginCell().storeStringTail(src.individualContent).endCell());
        } else {
            builder.storeRef(src.individualContent);
        }
    };
}

export function loadNftItemParams(slice: Slice): NftItemParams & { individualContent: Cell } {
    return {
        owner: slice.loadAddress(),
        individualContent: slice.loadRef(),
    };
}

export function createNftItemParamsValue(): NftItemParamsValue {
    return {
        store: storeNftItemParams,
        load: loadNftItemParams,
    };
}
