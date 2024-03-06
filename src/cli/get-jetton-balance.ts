import {createEnv, formatAddress, printInfo} from "./common";
import {Address} from "@ton/core";
import inquirer from "inquirer";

type UserInput = {
    jettonAddress: Address;
    ownerAddress: Address;
}

async function promptForUserInput(params: { defaultOwner: string }): Promise<UserInput> {
    const {jetton, owner} = await inquirer.prompt([{
        name: 'jetton',
        message: 'Enter jetton address',
    }, {
        name: 'owner',
        message: 'Enter owner address (default: your wallet address)',
        default: params.defaultOwner,
    }]);

    return {
        jettonAddress: Address.parse(jetton),
        ownerAddress: Address.parse(owner),
    };
}

export async function main() {
    const {sdk, network, sender} = await createEnv();
    const {jettonAddress, ownerAddress} = await promptForUserInput({
        defaultOwner: formatAddress(sender.address, network)
    });

    const jetton = sdk.openJetton(jettonAddress);
    const jettonWallet = await jetton.getWallet(ownerAddress);
    const jettonWalletData = await jettonWallet.getData();

    const jettonWalletInfo = {
        name: 'Jetton Wallet',
        jetton: jettonWalletData.jettonMaster,
        'jetton wallet': jettonWallet.address,
        owner: jettonWalletData.owner,
        balance: jettonWalletData.balance,
    };
    printInfo(jettonWalletInfo, network);
}
