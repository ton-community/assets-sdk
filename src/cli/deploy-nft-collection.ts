import {createEnv, formatAddress, printInfo} from "./common";
import inquirer from 'inquirer';
import {readFile} from 'fs/promises';
import {Address} from "@ton/core";
import {NftRoyaltyParams} from "../nft/NftCollection.data";

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
    type: 'nft' | 'sbt';
    royaltyParams?: NftRoyaltyParams;
};

async function promptForUserInput(params: { defaultRoyaltyRecipient: string }): Promise<UserInput> {
    const {defaultRoyaltyRecipient} = params;
    const {name, description, image, type} = await inquirer.prompt([{
        name: 'type',
        message: 'Choose collection type',
        type: 'list',
        choices: ['nft', 'sbt'],
    }, {
        name: 'name',
        message: 'Enter collection name',
    }, {
        name: 'description',
        message: 'Enter collection description',
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

    let royaltyParams: NftRoyaltyParams | undefined;
    if (type === 'nft') {
        const {royalty, royaltyRecipient} = await inquirer.prompt([{
            name: 'royalty',
            message: 'Enter royalty percentage (eg. 5%)',
            default: '5%',
            type: 'number',
            validate(input: any) {
                const royalty = parseFloat(input);
                if (isNaN(royalty) || royalty < 0 || royalty > 100) {
                    return 'Royalty must be a number between 0 and 100';
                }
                return true;
            }
        }, {
            name: 'royaltyRecipient',
            message: 'Enter royalty recipient address (default: your wallet address)',
            default: defaultRoyaltyRecipient,
        }]);

        // converting royalty to fraction
        const royaltyDenominator = 10000n;
        const royaltyNumerator = BigInt(Math.round(parseFloat(royalty) * Number(royaltyDenominator) / 100));
        royaltyParams = {
            numerator: royaltyNumerator,
            denominator: royaltyDenominator,
            recipient: Address.parse(royaltyRecipient)
        };
    }

    return {
        name: name,
        description: formattedDescription,
        image: formattedImage,
        type: type,
        royaltyParams: royaltyParams,
    };
}

export async function main() {
    const {sdk, network, sender} = await createEnv();
    const {name, description, image, type, royaltyParams} = await promptForUserInput({
        defaultRoyaltyRecipient: formatAddress(sender.address, network)
    });

    let uploadedImage: string | undefined;
    if (image.kind === 'url') {
        uploadedImage = image.url;
    } else if (image.kind === 'file') {
        uploadedImage = await sdk.storage.uploadFile(image.file);
    } else {
        uploadedImage = undefined;
    }

    const collectionContent = {
        commonContent: '',
        collectionContent: {
            name: name,
            description: description,
            image: uploadedImage,
        }
    };

    let createdCollection;
    if (type === 'nft') {
        const collectionParams = {royaltyParams: royaltyParams};
        createdCollection = await sdk.deployNftCollection(collectionContent, collectionParams);
    } else if (type === 'sbt') {
        createdCollection = await sdk.deploySbtCollection(collectionContent);
    } else {
        throw new Error(`Unknown collection type: ${type}`);
    }

    const collectionInfo = {
        name: name,
        description: description,
        image: uploadedImage,
        'collection address': createdCollection.address,
    };
    printInfo(collectionInfo, network);
}
