import 'dotenv/config';
import { Address, fromNano } from '@ton/core';
import inquirer from 'inquirer';

import { createEnv, formatAddress, printInfo } from './common';

type UserInput = {
    nftAddress: Address;
};

async function promptForUserInput(): Promise<UserInput> {
    const { item } = await inquirer.prompt([
        {
            name: 'item',
            message: 'Enter NFT address',
        },
    ]);

    return {
        nftAddress: Address.parse(item),
    };
}

export async function main() {
    const { sdk, network, sender } = await createEnv();
    const { nftAddress } = await promptForUserInput();

    const nft = sdk.openNftItem(nftAddress);
    const { owner } = await nft.getData();
    if (!owner) {
        throw new Error(`NFT ${formatAddress(nftAddress, network)} is not owned`);
    }

    const sale = sdk.openNftSale(owner);
    const saleData = await sale.getData();

    const saleInfo = {
        name: 'NFT Sale',
        price: fromNano(saleData.fullPrice) + ' TON',
        seller: saleData.nftOwner,
        sale: sale.address,
        marketplace: saleData.marketplace,
        marketplaceFee: fromNano(saleData.marketplaceFee) + ' TON',
        royalty: saleData.royaltyTo,
        royaltyFee: fromNano(saleData.royalty) + ' TON',
    };
    printInfo(saleInfo, network);

    const { confirm } = await inquirer.prompt([
        {
            name: 'confirm',
            message: 'Do you want to cancel sale?',
            type: 'confirm',
        },
    ]);
    if (!confirm) {
        return;
    }
    await sale.sendCancel(sender);

    const cancelledSaleInfo = {
        name: 'Cancelled NFT Sale',
        price: fromNano(saleData.fullPrice) + ' TON',
        seller: saleData.nftOwner,
        sale: sale.address,
        marketplace: saleData.marketplace,
        marketplaceFee: fromNano(saleData.marketplaceFee) + ' TON',
        royalty: saleData.royaltyTo,
        royaltyFee: fromNano(saleData.royalty) + ' TON',
    };
    printInfo(cancelledSaleInfo, network);
}
