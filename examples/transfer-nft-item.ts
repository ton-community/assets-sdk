import { Address, toNano } from '@ton/core";
import { GameFiSDK, createWalletV4 } from "../src/index";

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

    const nftCollection = sdk.openNftCollection(Address.parse('my-nft-collection-address'));
    const nftItem = await nftCollection.getItem(1n);
    await nftItem.sendTransfer({
        to: Address.parse('any-address'),
        value: toNano('0.03'),
    })
}

main();
