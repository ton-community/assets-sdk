import { createEnv, printAddress } from "./common";
import inquirer from 'inquirer';
import { readFile } from 'fs/promises';

export async function main() {
    const { sdk, network } = await createEnv();

    const q = await inquirer.prompt([{
        name: 'name',
        message: 'Enter jetton name',
    }, {
        name: 'description',
        message: 'Enter jetton description',
    }, {
        name: 'image',
        message: 'Enter image path or link',
    }, {
        name: 'symbol',
        message: 'Enter jetton symbol (for example TON)',
    }, {
        name: 'decimals',
        message: 'Enter jetton decimals (for example 9)',
        default: '9',
    }]);

    let image: string | undefined;
    if (q.image === '') {
        image = undefined;
    } else if (q.image.startsWith('http://') || q.image.startsWith('https://')) {
        image = q.image;
    } else {
        image = await sdk.storage.uploadFile(await readFile(q.image));
    }

    const jetton = await sdk.createJetton({
        name: q.name,
        description: q.description === '' ? undefined : q.description,
        image,
        symbol: q.symbol,
        decimals: parseInt(q.decimals),
    });

    const address = jetton.address;

    printAddress(address, network, 'jetton');
}
