import {toNano} from "@ton/core";
import {AssetsSDK, importKey, PinataStorageParams} from "../src";
import {createApi} from "../src/client/ton-client-api";
import {createSender} from "../src/wallets/wallets";

async function main() {
    const NETWORK = 'testnet';
    const api = await createApi(NETWORK);

    const keyPair = await importKey(process.env.MNEMONIC!);
    const sender = await createSender('highload-v2', keyPair, api);


    const storage: PinataStorageParams = {
        pinataApiKey: process.env.PINATA_API!,
        pinataSecretKey: process.env.PINATA_SECRET!,
    }

    const sdk = AssetsSDK.create({
        api: api,
        storage: storage,
        sender: sender,
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

main().catch(console.error);
