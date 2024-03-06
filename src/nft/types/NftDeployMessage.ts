import {Address, Builder, Cell, Slice} from "@ton/core";

export type NftDeployMessage = {
    owner: Address;
    content: Cell;
};

export function storeNftDeployMessage(message: NftDeployMessage): (builder: Builder) => void {
    return (builder) => {
        const {owner, content} = message;
        builder.storeAddress(owner)
            .storeRef(content);
    };
}

export function loadNftDeployMessage(slice: Slice): NftDeployMessage {
    const owner = slice.loadAddress();
    const content = slice.loadRef();
    return {
        owner,
        content,
    };
}
