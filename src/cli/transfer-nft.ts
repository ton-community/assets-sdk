import {Address} from "@ton/core";
import {createEnv, printInfo} from "./common";
import inquirer from 'inquirer';

type UserInput = {
    nftAddress: Address;
    recipient: Address;
};

async function promptForUserInput(): Promise<UserInput> {
    const {item, recipient} = await inquirer.prompt([{
        name: 'item',
        message: 'Enter item address',
    }, {
        name: 'recipient',
        message: 'Enter recipient address',
    }]);

    return {
        nftAddress: Address.parse(item),
        recipient: Address.parse(recipient),
    };
}

export async function main() {
    const {sdk, network, sender} = await createEnv();
    const {nftAddress, recipient} = await promptForUserInput();

    const item = sdk.openNftItem(nftAddress);
    await item.send(sender, recipient);

    const nftTransferInfo = {
        name: 'Transfer NFT',
        item: item.address,
        recipient: recipient,
    };
    printInfo(nftTransferInfo, network);
}
