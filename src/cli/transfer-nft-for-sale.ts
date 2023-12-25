import 'dotenv/config';
import { Address, toNano } from "@ton/core";
import { createEnv } from "./common";
import inquirer from 'inquirer';

export async function main() {
    const { sdk } = await createEnv();

    const q = await inquirer.prompt([{
        name: 'item',
        message: 'Enter NFT address',
    }, {
        name: 'recipient',
        message: 'Enter sale contract address',
    }]);

    const item = sdk.openNftItem(Address.parse(q.item));

    await item.sendTransfer({
        to: Address.parse(q.recipient),
        responseDestination: sdk.sender?.address,
        value: toNano('1.5'),
        forwardAmount: toNano('1'),
    });

    console.log('Your item has been transferred!');
}
