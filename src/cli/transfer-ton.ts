import {Address, fromNano, toNano} from "@ton/core";
import {createEnv, printInfo} from "./common";
import inquirer from 'inquirer';

type UserInput = {
    recipient: Address;
    amount: bigint;
};

async function promptTonTransfer(): Promise<UserInput> {
    const {recipient, amount} = await inquirer.prompt([{
        name: 'recipient',
        message: 'Enter recipient address',
    }, {
        name: 'amount',
        type: 'number',
        message: 'Enter amount in TON (eg. 1.5)',
        validate: (input: string) => {
            const amount = toNano(input);
            return amount > 0 ? true : 'Price must be a positive number';
        },
    }]);

    return {
        recipient: Address.parse(recipient),
        amount: toNano(amount),
    };
}

export async function main() {
    const {sdk, network} = await createEnv();
    const {recipient, amount} = await promptTonTransfer();

    await sdk.sender?.send({to: recipient, value: amount});

    const tonTransferInfo = {
        name: 'Transfer TON',
        recipient: recipient,
        amount: fromNano(amount) + ' TON',
    };
    printInfo(tonTransferInfo, network);
}
