import { Address } from "@ton/core";
import { createEnv } from "./common";
import inquirer from 'inquirer';

export async function main() {
    const { sdk } = await createEnv();

    const q = await inquirer.prompt([{
        name: 'item',
        message: 'Enter item address',
    }, {
        name: 'recipient',
        message: 'Enter recipient address',
    }]);

    const item = sdk.openNftItem(Address.parse(q.item));

    await item.sendTransfer({
        to: Address.parse(q.recipient),
    });

    console.log('Your item has been transferred!');
}
