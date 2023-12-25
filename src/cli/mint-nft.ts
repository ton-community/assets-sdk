import { createEnv, printAddress } from "./common";
import inquirer from 'inquirer';
import { readFile } from 'fs/promises';
import { Address } from '@ton/core';

export async function main() {
    const { sdk, network } = await createEnv();

    const q = await inquirer.prompt([{
        name: 'address',
        message: 'Enter collection address'
    }, {
        name: 'owner',
        message: 'Enter item owner',
    }, {
        name: 'name',
        message: 'Enter item name',
    }, {
        name: 'description',
        message: 'Enter item description',
    }, {
        name: 'image',
        message: 'Enter image path or link',
    }]);

    const collection = sdk.openNftCollection(Address.parse(q.address));

    let image: string | undefined;
    if (q.image === '') {
        image = undefined;
    } else if (q.image.startsWith('http://') || q.image.startsWith('https://')) {
        image = q.image;
    } else {
        image = await sdk.storage.uploadFile(await readFile(q.image));
    }

    const content = {
        name: q.name,
        description: q.description === '' ? undefined : q.description,
        image,
    };

    const contentUrl = await sdk.storage.uploadFile(Buffer.from(JSON.stringify(content)));

    const index = (await collection.getData()).nextItemIndex;

    await collection.sendMint({
        itemIndex: index,
        itemParams: {
            owner: Address.parse(q.owner),
            individualContent: contentUrl,
        }
    });

    const address = await collection.getItemAddress(index);

    printAddress(address, network, 'item');
}
