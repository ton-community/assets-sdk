import 'dotenv/config';
import { createEnv, printAddress } from './common';
import { Address, beginCell, toNano } from '@ton/core';
import inquirer from 'inquirer';

async function main() {
    const { sdk, network } = await createEnv();

    const q = await inquirer.prompt([{
        name: 'item',
        message: 'Enter NFT address',
    }, {
        name: 'price',
        message: 'Enter price in TON',
    }]);

    const nft = Address.parse(q.item);

    const sale = await sdk.createNftSale({
        nft,
        fullPrice: toNano(q.price),
        marketplace: new Address(0, Buffer.alloc(32)),
        marketplaceFeeTo: new Address(0, Buffer.alloc(32)),
        royaltyTo: new Address(0, Buffer.alloc(32)),
        marketplaceFee: 1n,
        royalty: 1n,
    });

    printAddress(sale.address, network, 'sale contract');

    console.log('Transfer your NFT to the sale contract using the following link:');

    console.log(`ton://transfer/${nft}?amount=1500000000&bin=` + beginCell()
        .storeUint(0x5fcc3d14, 32)
        .storeUint(0, 64)
        .storeAddress(sale.address)
        .storeAddress(sdk.sender?.address)
        .storeMaybeRef(null)
        .storeCoins(toNano('1'))
        .storeMaybeRef(null)
        .endCell().toBoc().toString('base64url'));

    console.log('Or using the transfer-nft-for-sale.ts script');
}

main();
