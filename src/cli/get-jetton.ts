import { Address } from '@ton/core';
import inquirer from 'inquirer';

import { createEnv, printInfo } from './common';

type UserInput = {
    jettonAddress: Address;
};

async function promptForUserInput(): Promise<UserInput> {
    const { jetton } = await inquirer.prompt([
        {
            name: 'jetton',
            message: 'Enter jetton address',
        },
    ]);

    return {
        jettonAddress: Address.parse(jetton),
    };
}

export async function main() {
    const { sdk, network } = await createEnv();
    const { jettonAddress } = await promptForUserInput();

    const jetton = sdk.openJetton(jettonAddress);
    const jettonData = await jetton.getData();
    const jettonContent = await jetton.getContent();

    const jettonInfo = {
        name: jettonContent.name,
        description: jettonContent.description,
        image: jettonContent.image?.toString('base64'),
        totalSupply: jettonData.totalSupply,
        mintable: jettonData.mintable,
        adminAddress: jettonData.adminAddress,
        symbol: jettonContent.symbol,
        decimals: jettonContent.decimals,
    };
    printInfo(jettonInfo, network);
}
