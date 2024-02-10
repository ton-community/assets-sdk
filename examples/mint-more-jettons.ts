import {Address} from "@ton/core";
import {AssetsSDK, importKey, PinataStorageParams} from "../src";
import {createSender} from "../src/wallets/wallets";
import {createApi} from "../src/client/api";

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

    const JETTON_ADDRESS = Address.parse('MY_JETTON_ADDRESS');
    const jetton = sdk.openJetton(JETTON_ADDRESS);

    const RECEIVER_ADDRESS = Address.parse('RECEIVER_ADDRESS');
    await jetton.sendMint({to: RECEIVER_ADDRESS, amount: 1200000n});
}

main().catch(console.error);
