import {createEnv, printInfo} from "./common";
import {Address} from "@ton/core";
import inquirer from "inquirer";

type UserInput = {
    collectionAddress: Address;
    index: bigint;
}

async function promptForUserInput(): Promise<UserInput> {
    const {collection, index} = await inquirer.prompt([{
        name: 'collection',
        message: 'Enter collection address',
    }, {
        name: 'index',
        message: 'Enter item index',
    }]);

    return {
        collectionAddress: Address.parse(collection),
        index: BigInt(index),
    };
}

export async function main() {
    const {sdk, network} = await createEnv();
    const {collectionAddress, index} = await promptForUserInput();

    const collection = sdk.openNftCollection(collectionAddress);
    const {nextItemIndex} = await collection.getData();
    if (index >= nextItemIndex) {
        throw new Error(`item with index ${index} does not exist in collection`);
    }

    const item = await collection.getItem(index);
    const itemData = await item.getData();
    const itemContent = await item.getContent();

    const itemInfo = {
        name: itemContent.name,
        description: itemContent.description,
        image: itemContent.image?.toString('base64'),
        owner: itemData.owner,
        collection: itemData.collection,
        index: itemData.index,
    };
    printInfo(itemInfo, network);
}
