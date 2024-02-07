import {createEnv, formatAddress, printInfo} from './common';
import {Address, fromNano} from '@ton/core';
import inquirer from "inquirer";

type UserInput = {
    address: Address;
};

async function promptForUserInput(params: { defaultOwner: string }): Promise<UserInput> {
    const {address} = await inquirer.prompt([{
        name: 'address',
        message: 'Enter wallet address (default: your wallet address)',
        default: params.defaultOwner,
    }]);

    return {
        address: Address.parse(address),
    };
}

export async function main() {
    const {client, wallet, network} = await createEnv();
    const {address} = await promptForUserInput({
        defaultOwner: formatAddress(wallet.wallet.address, network)
    });

    const masterAt = await client.getLastBlock();
    const state = await client.getAccountLite(masterAt.last.seqno, address);

    const walletInfo = {
        address: address,
        type: state.account.state.type,
        balance: fromNano(state.account.balance.coins) + ' TON',
    };
    printInfo(walletInfo, network)
}
