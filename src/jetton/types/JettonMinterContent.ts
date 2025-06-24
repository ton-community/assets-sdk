import { Address, Builder, Cell, Slice } from '@ton/core';

export type JettonMinterContent = {
    admin: Address;
    content: Cell;
    jettonWalletCode: Cell;
};

export function storeJettonMinterContent(src: JettonMinterContent) {
    return (builder: Builder) => {
        builder.storeCoins(0);
        builder.storeAddress(src.admin);
        builder.storeRef(src.content);
        builder.storeRef(src.jettonWalletCode);
    };
}

export function loadJettonMinterContent(slice: Slice): JettonMinterContent {
    slice.loadCoins();
    const adminAddress = slice.loadAddress();
    const jettonContent = slice.loadRef();
    const jettonWalletCode = slice.loadRef();

    return {
        admin: adminAddress,
        content: jettonContent,
        jettonWalletCode,
    };
}
