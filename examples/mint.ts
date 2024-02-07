import { toNano } from "@ton/core";
import { AssetsSDK, createWalletV4 } from "../src/index";

async function main() {
    const sdk = await AssetsSDK.create({
        storage: {
            pinataApiKey: process.env.PINATA_API!,
            pinataSecretKey: process.env.PINATA_SECRET!,
        },
        api: 'testnet',
        wallet: await createWalletV4(process.env.MNEMONIC!),
    });

    console.log('Using wallet', sdk.sender?.address);

    const jetton = await sdk.deployJetton({
        name: 'Test jetton 4',
        decimals: 9,
        description: 'Test jetton',
        symbol: 'TEST',
    }, {
        premint: {
            to: sdk.sender?.address!,
            amount: toNano('100'),
        },
    });

    console.log('Created jetton with address', jetton.address);
}

main();
