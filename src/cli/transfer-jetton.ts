import { Address } from "@ton/core";
import {createEnv, printAddress, printInfo} from "./common";
import inquirer from 'inquirer';

type UserInput = {
    address: Address;
    recipient: Address;
    amount: bigint;
};


async function promptJettonTransfer(): Promise<UserInput> {
    const {address, recipient, amount} = await inquirer.prompt([{
        name: 'address',
        message: 'Enter jetton address',
    }, {
        name: 'recipient',
        message: 'Enter recipient address',
    }, {
        name: 'amount',
        type: 'number',
        message: 'Enter amount in jetton units',
        validate: (input: string) => {
            const amount = BigInt(input);
            return amount > 0 ? true : 'Amount must be a positive integer';
        },
    }]);

    return {
        address: Address.parse(address),
        recipient: Address.parse(recipient),
        amount: BigInt(amount),
    };
}

export async function main() {
    const { sdk, network } = await createEnv();
    const { address, recipient, amount } = await promptJettonTransfer();

    const jetton = sdk.openJetton(address);

    const senderAddress = sdk.sender?.address;
    if (senderAddress === undefined) {
        throw new Error('Cannot open jetton wallet: sender address is unknown');
    }

    const jettonWallet = await jetton.getWallet(senderAddress);
    await jettonWallet.sendTransfer({ to: recipient, amount: amount });

    const jettonTransferInfo = {
        name: 'Transfer jetton',
        jetton: jetton.address,
        'jetton wallet': jettonWallet.address,
        recipient: recipient,
        amount: amount,
    };
    printInfo(jettonTransferInfo, network);
}
