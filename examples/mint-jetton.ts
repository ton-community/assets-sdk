import { toNano } from '@ton/core';

import { AssetsSDK, createApi, createSender, importKey, PinataStorageParams } from '../src';

async function main() {
    const NETWORK = 'testnet';
    const api = await createApi(NETWORK);

    const keyPair = await importKey(process.env.MNEMONIC!);
    const sender = await createSender('highload-v2', keyPair, api);

    const storage: PinataStorageParams = {
        pinataApiKey: process.env.PINATA_API_KEY!,
        pinataSecretKey: process.env.PINATA_SECRET!,
    };

    const sdk = AssetsSDK.create({
        api: api,
        storage: storage,
        sender: sender,
    });

    // eslint-disable-next-line no-console
    console.log('Using wallet', sdk.sender?.address);

    if (!sdk.sender) {
        throw new Error('Sender is not defined');
    }

    const jetton = await sdk.deployJetton(
        {
            name: 'Test jetton 4',
            decimals: 9,
            description: 'Test jetton',
            symbol: 'TEST',
        },
        {
            adminAddress: sdk.sender.address,
            premintAmount: toNano('100'),
        },
    );

    // eslint-disable-next-line no-console
    console.log('Created jetton with address', jetton.address);
}

// eslint-disable-next-line no-console
main().catch(console.error);
