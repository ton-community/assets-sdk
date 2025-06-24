import { writeFile } from 'fs/promises';

import inquirer from 'inquirer';
import { mnemonicNew } from '@ton/crypto';

import { WalletType, createWallet } from '../';
import { printAddress } from './common';
import { importKey } from '../key';

type S3Storage = {
    kind: 's3';
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
};

type PinataStorage = {
    kind: 'pinata';
    apiKey: string;
    secretKey: string;
};

type Storage = S3Storage | PinataStorage;

type Network = 'mainnet' | 'testnet';

export type Env = {
    network: Network;
    wallet: WalletType;
    storage: Storage;
};

export async function main() {
    const { network, wallet } = await inquirer.prompt([
        {
            name: 'network',
            message: 'Which network to use?',
            choices: ['mainnet', 'testnet'],
            type: 'list',
        },
        {
            name: 'wallet',
            message: 'Which wallet type to use?',
            choices: ['highload-v2'],
            type: 'list',
        },
    ]);

    const mnemonic = await mnemonicNew();

    const pairs: [string, string][] = [
        ['NETWORK', network],
        ['MNEMONIC', mnemonic.join(' ')],
        ['WALLET_TYPE', wallet],
    ];

    const keyPair = await importKey(mnemonic);
    const walletContract = await createWallet(wallet, keyPair.publicKey);
    const address = walletContract.address;

    const { storage } = await inquirer.prompt([
        {
            name: 'storage',
            message: 'Which storage to use?',
            choices: ['pinata', 's3'],
            type: 'list',
        },
    ]);

    pairs.push(['STORAGE_TYPE', storage]);

    if (storage === 'pinata') {
        const q = await inquirer.prompt([
            {
                name: 'apikey',
                message: 'Please enter your Pinata API key',
            },
            {
                name: 'secretkey',
                message: 'Please enter your Pinata secret key',
            },
        ]);
        pairs.push(['PINATA_API_KEY', q.apikey], ['PINATA_SECRET_KEY', q.secretkey]);
    } else if (storage === 's3') {
        const q = await inquirer.prompt([
            {
                name: 'accesskeyid',
                message: 'Please enter your S3 access key ID',
            },
            {
                name: 'secretaccesskey',
                message: 'Please enter your S3 secret access key',
            },
            {
                name: 'bucket',
                message: 'Please enter the S3 bucket name to use',
            },
        ]);
        pairs.push(
            ['S3_ACCESS_KEY_ID', q.accesskeyid],
            ['S3_SECRET_ACCESS_KEY', q.secretaccesskey],
            ['S3_BUCKET', q.bucket],
        );
    } else {
        throw new Error(`Unknown storage type: ${storage}`);
    }

    const { ipfsGateway } = await inquirer.prompt([
        {
            name: 'ipfsGateway',
            message: 'Which IPFS gateway to use?',
            choices: ['pinata', 'ipfs.io', 'https'],
            type: 'list',
        },
    ]);

    pairs.push(['IPFS_GATEWAY_TYPE', ipfsGateway]);

    if (ipfsGateway === 'ipfs.io') {
        pairs.push(['IPFS_GATEWAY', 'https://ipfs.io/']);
    } else if (ipfsGateway === 'https') {
        const { gateway } = await inquirer.prompt([
            {
                name: 'gateway',
                message: 'Please enter the IPFS gateway to use (e.g. https://ipfs.io/)',
            },
        ]);
        pairs.push(['IPFS_GATEWAY', gateway]);
    } else if (ipfsGateway === 'pinata') {
        const { gateway, apikey } = await inquirer.prompt([
            {
                name: 'gateway',
                message: 'Please enter the IPFS gateway to use (e.g. https://gateway.pinata.cloud/)',
            },
            {
                name: 'apikey',
                message: 'Please enter your Pinata Gateway API key',
            },
        ]);
        pairs.push(['IPFS_GATEWAY', gateway], ['IPFS_GATEWAY_API_KEY', apikey]);
    } else {
        throw new Error(`Unknown IPFS gateway type: ${ipfsGateway}`);
    }

    try {
        await writeFile('.env', pairs.map((p) => `${p[0]}="${p[1]}"`).join('\n'), {
            flag: 'wx',
        });
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        // eslint-disable-next-line no-console
        console.log('Could not write the .env file. Does it already exist?');
        return;
    }

    printAddress(address, network);
    if (network === 'testnet') {
        // eslint-disable-next-line no-console
        console.log('Please use https://t.me/testgiver_ton_bot to get some test TON');
    } else {
        // eslint-disable-next-line no-console
        console.log('Please use top up your wallet with some TON');
    }
}
