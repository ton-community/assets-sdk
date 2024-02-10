import {createEnv, printInfo} from "./common";
import inquirer from 'inquirer';
import {readFile} from 'fs/promises';

type ImageUrl = {
    kind: 'url',
    url: string,
};

type ImageFile = {
    kind: 'file',
    file: Buffer,
};

type NoImage = {
    kind: 'none',
};

type Image = ImageUrl | ImageFile | NoImage;

type UserInput = {
    name: string;
    description: string | undefined;
    image: Image;
    symbol: string;
    decimals: number;
};

async function promptForUserInput(): Promise<UserInput> {
    const {name, description, image, symbol, decimals} = await inquirer.prompt([{
        name: 'name',
        message: 'Enter jetton name',
    }, {
        name: 'description',
        message: 'Enter jetton description',
    }, {
        name: 'image',
        message: 'Enter image path or link',
        async validate(input: string) {
            if (input.startsWith('http://') || input.startsWith('https://')) {
                const response = await fetch(input);
                if (!response.ok) {
                    return 'Image file not found';
                }
                return true;
            }

            try {
                await readFile(input);
                return true;
            } catch (e) {
                return 'Image file not found';
            }
        }
    }, {
        name: 'symbol',
        message: 'Enter jetton symbol (for example TON)',
    }, {
        name: 'decimals',
        message: 'Enter jetton decimals (for example 9)',
        default: '9',
        type: 'number',
        validate: (value: string) => {
            const amount = BigInt(value);
            return amount >= 0 ? true : 'Amount must be a positive integer';
        }
    }]);

    let formattedImage: Image;
    if (image === '') {
        formattedImage = {kind: 'none'};
    } else if (image.startsWith('http://') || image.startsWith('https://')) {
        formattedImage = {kind: 'url', url: image};
    } else {
        formattedImage = {kind: 'file', file: await readFile(image)};
    }

    let formattedDescription: string | undefined;
    if (typeof description === 'string' && description !== '') {
        formattedDescription = description;
    }

    return {
        name: name,
        description: formattedDescription,
        image: formattedImage,
        symbol: symbol,
        decimals: parseInt(decimals),
    };
}

export async function main() {
    const {sdk, network} = await createEnv();
    const {name, description, image, symbol, decimals} = await promptForUserInput();

    let uploadImage: string | undefined;
    if (image.kind === 'url') {
        uploadImage = image.url;
    } else if (image.kind === 'file') {
        uploadImage = await sdk.storage.uploadFile(image.file);
    } else {
        uploadImage = undefined;
    }

    const jettonParams = {
        name: name,
        description: description,
        image: uploadImage,
        symbol: symbol,
        decimals: decimals,
    }
    const jetton = await sdk.deployJetton(jettonParams);

    const jettonInfo = {
        name: jettonParams.name,
        description: jettonParams.description,
        image: jettonParams.image,
        symbol: jettonParams.symbol,
        decimals: jettonParams.decimals,
        'jetton address': jetton.address,
    }
    printInfo(jettonInfo, network);
}
