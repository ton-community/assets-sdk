import {createEnv, printInfo} from "./common";
import {Address} from "@ton/core";
import inquirer from "inquirer";

type UserInput = {
    nftAddress: Address;
}

async function promptForUserInput(): Promise<UserInput> {
    const {item} = await inquirer.prompt([{
        name: 'item',
        message: 'Enter NFT item address',
    }]);

    return {
        nftAddress: Address.parse(item),
    };
}

export async function main() {
    const {sdk, network} = await createEnv();
    const {nftAddress} = await promptForUserInput();

    const nft = sdk.openNftItem(nftAddress);
    const nftData = await nft.getData();
    const nftContent = await nft.getContent();

    const itemInfo = {
        name: nftContent.name,
        description: nftContent.description,
        image: nftContent.image?.toString('base64'),
        owner: nftData.owner,
        collection: nftData.collection,
        index: nftData.index,
    };
    printInfo(itemInfo, network);
}
