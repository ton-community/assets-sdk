import inquirer from 'inquirer';
import { mnemonicNew } from '@ton/crypto';
import { writeFile } from 'fs/promises';
import { createWallet, printAddress } from './common';

export async function main() {
    const q = await inquirer.prompt([{
        name: 'network',
        message: 'Which network to use?',
        choices: ['mainnet', 'testnet'],
        type: 'list',
    }, {
        name: 'wallet',
        message: 'Which wallet type to use?',
        choices: ['v4', 'highload-v2'],
        type: 'list',
    }, {
        name: 'storage',
        message: 'Which storage to use?',
        choices: ['pinata', 's3'],
        type: 'list',
    }]);

    const mnemonic = await mnemonicNew();

    const pairs: [string, string][] = [
        ['NETWORK', q.network],
        ['MNEMONIC', mnemonic.join(' ')],
        ['WALLET_TYPE', q.wallet],
        ['STORAGE_TYPE', q.storage],
    ];

    const address = (await createWallet(q.wallet, mnemonic)).wallet.address;

    if (q.storage === 'pinata') {
        const q = await inquirer.prompt([{
            name: 'apikey',
            message: 'Please enter your Pinata API key',
        }, {
            name: 'secretkey',
            message: 'Please enter your Pinata secret key',
        }]);
        pairs.push(['PINATA_API_KEY', q.apikey], ['PINATA_SECRET_KEY', q.secretkey]);
    } else if (q.storage === 's3') {
        const q = await inquirer.prompt([{
            name: 'accesskeyid',
            message: 'Please enter your S3 access key ID',
        }, {
            name: 'secretaccesskey',
            message: 'Please enter your S3 secret access key',
        }, {
            name: 'bucket',
            message: 'Please enter the S3 bucket name to use'
        }]);
        pairs.push(['S3_ACCESS_KEY_ID', q.accesskeyid], ['S3_SECRET_ACCESS_KEY', q.secretaccesskey], ['S3_BUCKET', q.bucket]);
    } else {
        throw new Error(`Unknown storage type: ${q.storage}`);
    }

    try {
        await writeFile('.env', pairs.map(p => `${p[0]}="${p[1]}"`).join('\n'), {
            flag: 'wx',
        });
    } catch (e) {
        console.error(e);
        console.log('Could not write the .env file. Does it already exist?');
        return;
    }

    printAddress(address, q.network);
}
