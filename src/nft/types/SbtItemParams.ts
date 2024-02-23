import {Address, beginCell, Builder, Cell, Slice} from "@ton/core";
import {ParamsValue} from "../../common/types/ParamsValue";

export type SbtItemParams = {
    owner: Address,
    individualContent: Cell | string,
    authority: Address | null,
};
export type SbtItemParamsValue = ParamsValue<SbtItemParams>;

export function storeSbtItemParams(src: SbtItemParams) {
    return (builder: Builder) => {
        builder.storeAddress(src.owner);
        if (typeof src.individualContent === 'string') {
            builder.storeRef(beginCell().storeStringTail(src.individualContent).endCell());
        } else {
            builder.storeRef(src.individualContent);
        }
        builder.storeAddress(src.authority);
    };
}

export function loadSbtItemParams(slice: Slice): SbtItemParams {
    const owner = slice.loadAddress();
    const content = slice.loadRef();
    const authority = slice.loadMaybeAddress();

    return {owner, individualContent: content, authority};
}

export function createSbtItemParamsValue(): SbtItemParamsValue {
    return {
        store: storeSbtItemParams,
        load: loadSbtItemParams,
    };
}
