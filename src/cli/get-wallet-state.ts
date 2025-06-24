import { Address, fromNano } from '@ton/core';
import inquirer from 'inquirer';

import { createEnv, formatAddress, printInfo } from './common';

type UserInput = {
    address: Address;
};

async function promptForUserInput(params: { defaultOwner: string }): Promise<UserInput> {
    const { address } = await inquirer.prompt([
        {
            name: 'address',
            message: 'Enter wallet address (default: your wallet address)',
            default: params.defaultOwner,
        },
    ]);

    return {
        address: Address.parse(address),
    };
}

export async function main() {
    const { client, sender, network } = await createEnv();
    const { address } = await promptForUserInput({
        defaultOwner: formatAddress(sender.address, network),
    });

    const account = await client.provider(address).getState();

    const walletInfo = {
        address: address,
        type: account.state.type,
        balance: fromNano(account.balance) + ' TON',
    };
    printInfo(walletInfo, network);
}
