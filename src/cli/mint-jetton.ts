import {createEnv, formatAddress, printInfo} from "./common";
import inquirer from 'inquirer';
import {Address} from '@ton/core';

type UserInput = {
    address: Address;
    owner: Address;
    amount: bigint;
};

async function promptForUserInput(params: { defaultOwner: string }): Promise<UserInput> {
    const {address, owner, amount} = await inquirer.prompt([{
        name: 'address',
        message: 'Enter jetton address'
    }, {
        name: 'owner',
        message: 'Enter minted jetton owner (default: your wallet address)',
        default: params.defaultOwner,
    }, {
        name: 'amount',
        message: 'Enter amount in jetton units',
        type: 'number',
        validate: (value: string) => {
            const amount = BigInt(value);
            return amount > 0 ? true : 'Amount must be a positive integer';
        }
    }]);

    return {
        address: Address.parse(address),
        owner: Address.parse(owner),
        amount: BigInt(amount),
    };
}

export async function main() {
    const {sdk, network, wallet} = await createEnv();
    const {address, owner, amount} = await promptForUserInput({
        defaultOwner: formatAddress(wallet.address, network)
    });

    const jetton = sdk.openJetton(address);
    await jetton.sendMint({to: owner, amount: amount});

    const jettonMintInfo = {
        name: 'Minted Jetton',
        'minted jetton': jetton.address,
        'owner': owner,
        'amount': amount,
    };
    printInfo(jettonMintInfo, network);
}
