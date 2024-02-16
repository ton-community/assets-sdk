import 'dotenv/config';
import {createEnv, printInfo} from './common';
import {Address, fromNano, toNano} from '@ton/core';
import inquirer from 'inquirer';
import {NftSaleData, NftSaleParams} from "../nft/data";


type UserInput = {
    nftAddress: Address;
    price: bigint;
    marketplaceFeeNumerator: bigint;
    marketplaceFeeDenominator: bigint;
};

async function promptForUserInput(): Promise<UserInput> {
    const {item, price, marketplaceFee} = await inquirer.prompt([{
        name: 'item',
        message: 'Enter NFT address',
    }, {
        name: 'price',
        message: 'Enter price in TON (eg. 1.5)',
        mask: '\d+\.?\d*',
        type: 'number',
        validate: (value: string) => {
            const price = parseFloat(value);
            return price > 0 ? true : 'Price must be a positive number';
        }
    }, {
        name: 'marketplaceFee',
        message: 'Enter marketplace fee percentage (eg. 5%)',
        mask: '\d+\.?\d*',
        default: '5%',
        type: 'number',
        validate(input: any) {
            const fee = parseFloat(input);
            if (isNaN(fee) || fee < 0 || fee > 100) {
                return 'Fee must be a number between 0 and 100';
            }
            return true;
        }
    }]);

    // converting marketplace fee to fraction
    const marketplaceFeeDenominator = 10000n;
    const marketplaceFeeNumerator = BigInt(Math.round(parseFloat(marketplaceFee) * Number(marketplaceFeeDenominator) / 100));

    return {
        nftAddress: Address.parse(item),
        price: toNano(price),
        marketplaceFeeNumerator,
        marketplaceFeeDenominator,
    };
}

async function verifySale(saleData: NftSaleData, saleParams: NftSaleParams) {
    // check is complete sale
    if (saleData.isComplete) {
        throw new Error(`Sale is already complete`);
    }

    // check marketplace address
    if (!saleData.marketplace.equals(saleParams.marketplace)) {
        throw new Error(`Sale marketplace is not equal to the sender address`);
    }

    // check nft address, should be equal to the nft address
    if (!saleData.nft.equals(saleParams.nft)) {
        throw new Error(`Sale nft is not equal to the nft address`);
    }

    // check nft owner, should be null because nft is not transferred yet
    if (saleData.nftOwner !== null) {
        throw new Error(`Sale nft owner is not null`);
    }

    // check full price
    if (saleData.fullPrice !== saleParams.fullPrice) {
        throw new Error(`Sale full price is not equal to the price`);
    }

    // check marketplace fee address
    if (!saleData.marketplaceFeeTo.equals(saleParams.marketplaceFeeTo)) {
        throw new Error(`Sale marketplace fee to is not equal to the sender address`);
    }

    // check marketplace fee
    if (saleData.marketplaceFee !== saleParams.marketplaceFee) {
        throw new Error(`Sale marketplace fee is not equal to the marketplace fee`);
    }

    // check royalty address
    saleParams.royaltyTo ??= null;
    if (saleData.royaltyTo === null || saleParams.royaltyTo === null) {
        if (saleData.royaltyTo !== saleParams.royaltyTo) {
            throw new Error(`Sale royalty to is not equal to the recipient`);
        }
    } else if (!saleData.royaltyTo.equals(saleParams.royaltyTo)) {
        throw new Error(`Sale royalty to is not equal to the recipient`);
    }

    // check royalty
    if (saleData.royalty !== saleParams.royalty) {
        throw new Error(`Sale royalty is not equal to the royalty`);
    }
}

export async function main() {
    const {sdk, network, sender} = await createEnv();
    const {nftAddress, price, marketplaceFeeNumerator, marketplaceFeeDenominator} = await promptForUserInput();

    const nft = sdk.openNftItem(nftAddress);

    const royaltyParams = await nft.getRoyaltyParams();
    const royaltyTo = royaltyParams.recipient;
    const calculatedRoyalty = (price * royaltyParams.numerator) / royaltyParams.denominator;

    const marketplaceAddress = sdk.sender?.address;
    if (!marketplaceAddress) {
        throw new Error(`Sender address is not defined`);
    }
    const marketplaceFeeTo = sdk.sender?.address;
    if (!marketplaceFeeTo) {
        throw new Error(`Sender address is not defined`);
    }
    const calculatedMarketplaceFee = price * marketplaceFeeNumerator / marketplaceFeeDenominator;

    const saleParams = {
        nft: nft.address,
        fullPrice: price,
        marketplace: marketplaceAddress,
        marketplaceFeeTo: marketplaceFeeTo,
        royaltyTo: royaltyTo,
        marketplaceFee: calculatedMarketplaceFee,
        royalty: calculatedRoyalty,
    };
    const sale = await sdk.deployNftSale(saleParams);
    const saleData = await sale.getData();
    await verifySale(saleData, saleParams);

    await nft.send(sender, sale.address, { notify: true, returnExcess: true }, toNano('0.05'));
    const {nftOwner: seller} = await sale.getData();

    const saleInfo = {
        name: 'Created NFT sale',
        price: fromNano(saleData.fullPrice) + ' TON',
        seller: seller,
        sale: sale.address,
        marketplace: saleData.marketplace,
        marketplaceFee: fromNano(saleData.marketplaceFee) + ' TON',
        royalty: saleData.royaltyTo,
        royaltyFee: fromNano(saleData.royalty) + ' TON',
        'sale address': sale.address,
    };
    printInfo(saleInfo, network);
}
