import { Address, Cell } from '@ton/core';

export type JettonWalletData = {
    balance: bigint;
    owner: Address;
    jettonMaster: Address;
    jettonWalletCode: Cell;
};
