import { Address, toNano } from '@ton/core';
import { GameFiSDK, createWalletV4 } from '../src/index";

async function main() {
    const sdk = await GameFiSDK.create({
        storage: {
            pinataApiKey: process.env.PINATA_API!,
            pinataSecretKey: process.env.PINATA_SECRET!,
        },
        api: 'testnet',
        wallet: await createWalletV4(process.env.MNEMONIC!),
    });

    console.log('Using wallet', sdk.sender?.address);

    const nftCollection = await sdk.createNftCollection({
        collectionContent: {
            uri: 'test-uri',
            name: 'test-name',
            description: 'lorem ipsum',
            image: 'test-image',
        },
        commonContent: 'test-content'
    }, {
        premint: {
            itemIndex: 1n,
            itemParams: {
                individualContent: 'test',
                owner: Address.parse('test-address')
            }
        },
    });

    console.log('Created nft collection with address', nftCollection.address);
}

main();
