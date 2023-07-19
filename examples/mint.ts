import { toNano } from "ton-core";
import { GameFiSDK } from "../src/sdk";

async function main() {
    const sdk = await GameFiSDK.create({
        storage: {
            pinataApiKey: process.env.PINATA_API!,
            pinataSecretKey: process.env.PINATA_SECRET!,
        },
        api: 'testnet',
        wallet: process.env.MNEMONIC!,
    });

    console.log('Using wallet', sdk.sender?.address);

    const jetton = await sdk.createJetton({
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
