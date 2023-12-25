import { createEnv, printAddress } from "./common";
import inquirer from 'inquirer';
import { readFile } from 'fs/promises';
import { Address } from '@ton/core';

export async function main() {
    const { sdk, network } = await createEnv();

    const q = await inquirer.prompt([{
        name: 'name',
        message: 'Enter collection name',
    }, {
        name: 'description',
        message: 'Enter collection description',
    }, {
        name: 'image',
        message: 'Enter image path or link',
    }, {
        name: 'type',
        message: 'Choose collection type',
        type: 'list',
        choices: ['nft', 'sbt'],
    }]);

    let image: string | undefined;
    if (q.image === '') {
        image = undefined;
    } else if (q.image.startsWith('http://') || q.image.startsWith('https://')) {
        image = q.image;
    } else {
        image = await sdk.storage.uploadFile(await readFile(q.image));
    }

    let address: Address | undefined = undefined;
    if (q.type === 'nft') {
        const collection = await sdk.createNftCollection({
            commonContent: '',
            collectionContent: {
                name: q.name,
                description: q.description === '' ? undefined : q.description,
                image,
            }
        });
        address = collection.address;
    } else if (q.type === 'sbt') {
        const collection = await sdk.createSbtCollection({
            commonContent: '',
            collectionContent: {
                name: q.name,
                description: q.description === '' ? undefined : q.description,
                image,
            }
        });
        address = collection.address;
    }

    if (address === undefined) {
        throw new Error(`Unknown collection type: ${q.type}`);
    }

    printAddress(address, network, 'collection');
}
