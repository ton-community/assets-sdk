import {createEnv, formatAddress, printAddress, printInfo} from "./common";
import {Address} from "@ton/core";
import inquirer from "inquirer";
import boxen from "boxen";
import chalk from "chalk";

type UserInput = {
    collectionAddress: Address;
}

async function promptForUserInput(): Promise<UserInput> {
    const {collection} = await inquirer.prompt([{
        name: 'collection',
        message: 'Enter collection address',
    }]);

    return {
        collectionAddress: Address.parse(collection),
    };
}

export async function main() {
    const {sdk, network} = await createEnv();
    const {collectionAddress} = await promptForUserInput();

    const collection = sdk.openNftCollection(collectionAddress);
    const collectionData = await collection.getData();
    const collectionContent = await collection.getContent();

    const collectionInfo = {
        name: collectionContent.name,
        description: collectionContent.description,
        image: collectionContent.image?.toString('base64'),
        owner: collectionData.owner,
        items: collectionData.nextItemIndex,
    };
    printInfo(collectionInfo, network);
}
