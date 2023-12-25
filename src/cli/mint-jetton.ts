import { createEnv } from "./common";
import inquirer from 'inquirer';
import { Address } from '@ton/core';

export async function main() {
    const { sdk } = await createEnv();

    const q = await inquirer.prompt([{
        name: 'address',
        message: 'Enter jetton address'
    }, {
        name: 'owner',
        message: 'Enter minted jetton owner',
    }, {
        name: 'amount',
        message: 'Enter amount in jetton units',
    }]);

    const jetton = sdk.openJetton(Address.parse(q.address));

    await jetton.sendMint({
        to: Address.parse(q.owner),
        amount: BigInt(q.amount),
    });

    console.log('Your jetton have been minted!');
}
