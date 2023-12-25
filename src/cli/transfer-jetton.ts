import { Address } from "@ton/core";
import { createEnv } from "./common";
import inquirer from 'inquirer';

export async function main() {
    const { sdk } = await createEnv();

    const q = await inquirer.prompt([{
        name: 'address',
        message: 'Enter jetton address',
    }, {
        name: 'recipient',
        message: 'Enter recipient address',
    }, {
        name: 'amount',
        message: 'Enter amount in jetton units',
    }]);

    const jetton = sdk.openJetton(Address.parse(q.address));

    const senderAddress = sdk.sender?.address;
    if (senderAddress === undefined) {
        throw new Error('Cannot open jetton wallet: sender address is unknown');
    }

    const wallet = await jetton.getWallet(senderAddress);

    await wallet.sendTransfer({
        to: Address.parse(q.recipient),
        amount: BigInt(q.amount),
    });

    console.log('Your jetton have been transferred!');
}
