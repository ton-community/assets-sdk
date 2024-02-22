import {createEnv, formatAddress, printInfo, retry} from "./common";
import inquirer from 'inquirer';
import {readFile} from 'fs/promises';
import {Address} from '@ton/core';

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
    address: Address;
    owner: Address;
    name: string;
    description: string | undefined;
    image: Image;
};

async function promptForUserInput(params: { defaultOwner: string }): Promise<UserInput> {
    const {address, owner, name, description, image} = await inquirer.prompt([{
        name: 'address',
        message: 'Enter collection address'
    }, {
        name: 'owner',
        message: 'Enter item owner (default: your wallet address)',
        default: params.defaultOwner,
    }, {
        name: 'name',
        message: 'Enter item name',
    }, {
        name: 'description',
        message: 'Enter item description',
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

    return {
        address: Address.parse(address),
        owner: Address.parse(owner),
        name: name,
        description: formattedDescription,
        image: formattedImage,
    };
}

export async function main() {
    const {sdk, network, sender} = await createEnv();
    const {address, owner, name, description, image} = await promptForUserInput({
        defaultOwner: formatAddress(sender.address, network)
    });

    const collection = sdk.openSbtCollection(address);

    let uploadedImage: string | undefined;
    if (image.kind === 'url') {
        uploadedImage = image.url;
    } else if (image.kind === 'file') {
        uploadedImage = await retry(() => sdk.storage.uploadFile(image.file), {name: 'upload image'});
    } else {
        uploadedImage = undefined;
    }

    const content = Buffer.from(JSON.stringify({
        name: name,
        description: description,
        image: uploadedImage,
    }));
    const contentUrl = await retry(() => sdk.storage.uploadFile(content), {name: 'upload image'});
    const {nextItemIndex: index} = await collection.getData();
    await collection.sendMint(sender, {
        index: index,
        owner: owner,
        individualContent: contentUrl,
        authority: null,
    });

    const sbtItem = await collection.getItem(index);
    const sbtItemInfo = {
        name: name,
        description: description,
        image: uploadedImage,
        owner: owner,
        collection: address,
        index: index,
        'sbt address': sbtItem.address,
    };
    printInfo(sbtItemInfo, network)
}
