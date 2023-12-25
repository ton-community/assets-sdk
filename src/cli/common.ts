import { Address } from "@ton/core";
import { ExtendedTonClient4, GameFiSDK, PinataStorage, S3Storage, createHighloadV2, createWalletV4 } from "..";
import { getHttpV4Endpoint } from '@orbs-network/ton-access';

export async function createWallet(type: string, mnemonic: string | string[]) {
    if (type === 'v4') {
        return await createWalletV4(mnemonic);
    } else if (type === 'highload-v2') {
        return await createHighloadV2(mnemonic);
    }
    throw new Error(`Unknown wallet type: ${type}`);
}

export async function createClient(network: string) {
    if (!(network === 'testnet' || network === 'mainnet')) {
        throw new Error(`Unknown network: ${network}`);
    }
    return new ExtendedTonClient4({
        endpoint: await getHttpV4Endpoint({
            network,
        }),
    });
}

export async function createStorageEnv() {
    if (process.env.STORAGE_TYPE === undefined) throw new Error('No STORAGE_TYPE in env!');

    if (process.env.STORAGE_TYPE === 'pinata') {
        if (process.env.PINATA_API_KEY === undefined) throw new Error('No PINATA_API_KEY in env!');
        if (process.env.PINATA_SECRET_KEY === undefined) throw new Error('No PINATA_SECRET_KEY in env!');

        return new PinataStorage(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
    } else if (process.env.STORAGE_TYPE === 's3') {
        if (process.env.S3_ACCESS_KEY_ID === undefined) throw new Error('No S3_ACCESS_KEY_ID in env!');
        if (process.env.S3_SECRET_ACCESS_KEY === undefined) throw new Error('No S3_SECRET_ACCESS_KEY in env!');
        if (process.env.S3_BUCKET === undefined) throw new Error('No S3_BUCKET in env!');

        return new S3Storage(process.env.S3_ACCESS_KEY_ID, process.env.S3_SECRET_ACCESS_KEY, process.env.S3_BUCKET);
    }

    throw new Error(`Unknown storage type: ${process.env.STORAGE_TYPE}`);
}

export async function createEnv() {
    if (process.env.WALLET_TYPE === undefined) throw new Error('No WALLET_TYPE in env!');
    if (process.env.MNEMONIC === undefined) throw new Error('No MNEMONIC in env!');
    if (process.env.NETWORK === undefined) throw new Error('No NETWORK in env!');

    const storage = await createStorageEnv();
    const wallet = await createWallet(process.env.WALLET_TYPE, process.env.MNEMONIC);
    const client = await createClient(process.env.NETWORK);
    const sdk = await GameFiSDK.create({
        storage,
        api: {
            open: c => client.openExtended(c),
            provider: (a, i) => client.provider(a, i),
        },
        wallet,
    });

    return {
        sdk,
        network: process.env.NETWORK,
        storage: await createStorageEnv(),
        wallet: await createWallet(process.env.WALLET_TYPE, process.env.MNEMONIC),
        client: await createClient(process.env.NETWORK),
    };
}

export function printAddress(address: Address | string, network: string, name = 'wallet') {
    console.log(`Your ${name} has the address ${address}
You can view it at https://${network === 'testnet' ? 'testnet.' : ''}tonviewer.com/${address}`);
}
