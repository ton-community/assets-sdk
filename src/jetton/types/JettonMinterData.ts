import { Address, Cell } from '@ton/core';

export interface JettonMinterData {
    totalSupply: bigint;
    mintable: boolean;
    adminAddress: Address | null;
    jettonContent: Cell;
    jettonWalletCode: Cell;
}
