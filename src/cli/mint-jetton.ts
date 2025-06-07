import inquirer from 'inquirer';
import { Address } from '@ton/core';

import { createEnv, formatAddress, printInfo } from './common';

type UserInput = {
    address: Address;
    recipient: Address;
    amount: bigint;
};

async function promptForUserInput(params: { defaultRecipient: string }): Promise<UserInput> {
    const { address, recipient, amount } = await inquirer.prompt([
        {
            name: 'address',
            message: 'Enter jetton address',
        },
        {
            name: 'recipient',
            message: 'Enter minted jetton recipient (default: your wallet address)',
            default: params.defaultRecipient,
        },
        {
            name: 'amount',
            message: 'Enter amount in jetton units',
            type: 'number',
            validate: (value: string) => {
                const amount = BigInt(value);
                return amount > 0 ? true : 'Amount must be a positive integer';
            },
        },
    ]);

    return {
        address: Address.parse(address),
        recipient: Address.parse(recipient),
        amount: BigInt(amount),
    };
}

export async function main() {
    const { sdk, network, sender } = await createEnv();
    const { address, recipient, amount } = await promptForUserInput({
        defaultRecipient: formatAddress(sender.address, network),
    });

    const jetton = sdk.openJetton(address);
    await jetton.sendMint(sender, recipient, amount);

    const jettonMintInfo = {
        name: 'Minted Jetton',
        'minted jetton': jetton.address,
        recipient: recipient,
        amount: amount,
    };
    printInfo(jettonMintInfo, network);
}
