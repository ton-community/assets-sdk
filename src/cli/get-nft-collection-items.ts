import { Address } from '@ton/core';
import inquirer from 'inquirer';
import chalk from 'chalk';

import { createEnv, printInfo } from './common';

type UserInput = {
    collectionAddress: Address;
    limit: number;
    skip: number;
};

async function promptForUserInput(): Promise<UserInput> {
    const { collection, limit, skip } = await inquirer.prompt([
        {
            name: 'collection',
            message: 'Enter collection address',
        },
        {
            name: 'limit',
            message: 'Enter limit (100 by default)',
            default: '100',
        },
        {
            name: 'skip',
            message: 'Enter skip (0 by default)',
            default: '0',
        },
    ]);

    return {
        collectionAddress: Address.parse(collection),
        limit: parseInt(limit),
        skip: parseInt(skip),
    };
}

export async function main() {
    const { sdk, network } = await createEnv();
    const { collectionAddress, limit, skip } = await promptForUserInput();

    const collection = sdk.openNftCollection(collectionAddress);
    const { nextItemIndex } = await collection.getData();
    if (nextItemIndex === 0n) {
        // eslint-disable-next-line no-console
        console.log(`${chalk.yellow('...')} ${chalk.yellow('collection is empty')}`);
        return;
    }
    if (skip >= nextItemIndex) {
        throw new Error(`Skip is too big, collection contains only ${nextItemIndex} items`);
    }

    const count = Math.min(limit, Number(nextItemIndex) - skip);
    const items = Array.from({ length: count }, (_, i) => i + Number(skip));
    const itemsData = await Promise.all(
        items.map(async (index) => {
            const item = await collection.getItem(BigInt(index));
            const itemData = await item.getData();
            return {
                index: itemData.index,
                owner: itemData.owner,
                nftAddress: item.address,
            };
        }),
    );

    for (const itemData of itemsData) {
        const itemInfo = {
            name: `Item #${itemData.index}`,
            address: itemData.nftAddress,
            owner: itemData.owner,
        };
        printInfo(itemInfo, network);
    }

    const hasMore = nextItemIndex > BigInt(skip + count);
    if (hasMore) {
        // eslint-disable-next-line no-console
        console.log(`${chalk.yellow('...')} ${chalk.yellow(nextItemIndex - BigInt(skip + count))} more items`);
    }
}
