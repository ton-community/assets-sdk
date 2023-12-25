import { createEnv, printAddress } from './common';
import { fromNano } from '@ton/core';

export async function main() {
    const { client, wallet, network } = await createEnv();

    const address = wallet.wallet.address;

    printAddress(address, network);

    const state = await client.getAccountLite((await client.getLastBlock()).last.seqno, address);

    console.log(`Your wallet is ${state.account.state.type} and has ${fromNano(state.account.balance.coins)} TON`);
}
