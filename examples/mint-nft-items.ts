import { Address } from "@ton/core";
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
    nftCollection.sendMint({
        itemIndex: 2n,
        itemParams: {
            individualContent: 'test-content',
            owner: Address.parse('any-address'),
        },
    })
}

main();
