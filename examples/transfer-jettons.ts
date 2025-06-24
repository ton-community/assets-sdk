import { Address, toNano } from '@ton/core';

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

    const JETTON_ADDRESS = Address.parse('MY_JETTON_ADDRESS');
    const jetton = await sdk.openJetton(JETTON_ADDRESS);

    const RECEIVER_ADDRESS = Address.parse('RECEIVER_ADDRESS');
    const myJettonWallet = await jetton.getWallet(sdk.sender!.address!);
    await myJettonWallet.send(sender, RECEIVER_ADDRESS, toNano(10));
}

// eslint-disable-next-line no-console
main().catch(console.error);
