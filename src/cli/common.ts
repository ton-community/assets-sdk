import {Address, Cell} from "@ton/core";
import {AssetsSDK, createApi, createWallet, importKey, PinataStorage, S3Storage} from "..";
import {DefaultContentResolver} from "../content";
import chalk from "chalk";
import boxen from "boxen";

export function createStorageEnv() {
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

export function createContentResolver() {
    if (process.env.IPFS_GATEWAY_TYPE === undefined) throw new Error('No IPFS_GATEWAY_TYPE in env!');

    if (process.env.IPFS_GATEWAY_TYPE === 'ipfs.io') {
        return new DefaultContentResolver((id: string) => `https://ipfs.io/ipfs/${id}`);
    }

    if (process.env.IPFS_GATEWAY_TYPE === 'https') {
        if (process.env.IPFS_GATEWAY === undefined) throw new Error('No IPFS_GATEWAY in env!');
        const ipfsGateway = new URL(process.env.IPFS_GATEWAY);

        return new DefaultContentResolver((id: string) => {
            ipfsGateway.pathname = '/ipfs/' + id;
            return ipfsGateway.toString();
        });
    }

    if (process.env.IPFS_GATEWAY_TYPE === 'pinata') {
        if (process.env.IPFS_GATEWAY === undefined) throw new Error('No IPFS_GATEWAY in env!');
        if (process.env.IPFS_GATEWAY_API_KEY === undefined) throw new Error('No IPFS_GATEWAY_API_KEY in env!');
        const ipfsGateway = new URL(process.env.IPFS_GATEWAY);

        return new DefaultContentResolver((id: string) => {
            ipfsGateway.pathname = '/ipfs/' + id;
            ipfsGateway.searchParams.set('pinataGatewayToken', process.env.IPFS_GATEWAY_API_KEY!);
            return ipfsGateway.toString();
        });
    }

    throw new Error(`Unknown IPFS gateway type: ${process.env.IPFS_GATEWAY_TYPE}`);
}

export async function createEnv() {
    if (process.env.WALLET_TYPE === undefined) throw new Error('No WALLET_TYPE in env!');
    if (process.env.WALLET_TYPE !== 'highload-v2') throw new Error(`Unknown wallet type: ${process.env.WALLET_TYPE}`);
    if (process.env.MNEMONIC === undefined) throw new Error('No MNEMONIC in env!');
    if (process.env.NETWORK === undefined) throw new Error('No NETWORK in env!');
    if (process.env.NETWORK !== 'mainnet' && process.env.NETWORK !== 'testnet') throw new Error(`Unknown network: ${process.env.NETWORK}`);

    const contentResolver = createContentResolver();
    const storage = createStorageEnv();
    const client = await createApi(process.env.NETWORK);
    const keyPair = await importKey(process.env.MNEMONIC);
    const {publicKey, secretKey} = keyPair;

    const walletContract = await createWallet(process.env.WALLET_TYPE, publicKey);
    const sender = client.open(walletContract).sender(keyPair.secretKey);

    const sdk = AssetsSDK.create({
        storage,
        api: client,
        sender: sender,
        contentResolver
    });

    return {
        sdk,
        network: process.env.NETWORK,
        storage: storage,
        sender: sender,
        client: client,
    };
}

export function printInfo(info: Record<string, Cell | Address | string | number | bigint | boolean | null | undefined>, network: string): void {
    const keys = Object.keys(info);
    const rows = [];
    for (const key of keys) {
        let value = info[key];
        if (typeof value === 'string') {
            value = chalk.green(value);
        } else if (typeof value === 'bigint') {
            value = chalk.yellow(value.toString());
        } else if (typeof value === 'number') {
            value = chalk.cyan(value);
        } else if (typeof value === 'boolean') {
            value = chalk.blue(value);
        } else if (value === null) {
            value = chalk.red('null');
        } else if (value === undefined) {
            value = chalk.red('undefined');
        } else if (Address.isAddress(value)) {
            value = `${chalk.magenta(formatAddress(value, network))} ${chalk.blue(formatAddressLink(value, network))}`;
        } else if (value instanceof Cell) {
            value = chalk.blue(value.toString('base64'));
        } else {
            throw new Error(`Unknown type: ${typeof value}`);
        }
        rows.push([key, value]);
    }

    console.log(boxen(
        rows.filter(([key]) => key !== 'name').map(([key, value]) => `${chalk.bold(key)}: ${value}`).join('\n'),
        {
            padding: {
                top: 0,
                bottom: 0,
                left: 1,
                right: 1,
            },
            borderStyle: 'round',
            borderColor: 'green',
            title: rows.find(([key, value]) => key === 'name')?.[1] as string | undefined,
        }
    ));
}

export function printAddress(address: Address | null, network: string, name = 'wallet'): void {
    const formattedAddress = formatAddress(address, network);
    const formattedAddressLink = formatAddressLink(address, network);

    console.log(`Your ${name} has the address ${formattedAddress}
You can view it at ${formattedAddressLink}`);
}

export function formatAddress(address: Address | null | undefined, network: string): string {
    if (!address) {
        return 'null';
    }

    return address.toString({testOnly: network === 'testnet', bounceable: true});
}

export function formatAddressLink(address: Address | null | void, network: string): string {
    if (!address) {
        return 'null';
    }

    return `https://${network === 'testnet' ? 'testnet.' : ''}tonviewer.com/${formatAddress(address, network)}`;
}

export async function retry<T>(fn: () => Promise<T>, options?: { name?: string, retries?: number, delay?: number }): Promise<T> {
    let { retries, delay, name } = { retries: 3, delay: 1000, ...options };
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (e) {
            console.log(`Attempt ${i + 1} failed: ${name ? name + ': ' : ''}${e}`);
        }
        await new Promise(resolve => setTimeout(resolve, delay * 2 ** i));
    }
    throw new Error('Exceeded number of retries');
}
