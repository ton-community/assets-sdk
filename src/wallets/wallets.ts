import {HighloadWalletContractV2} from "./HighloadWalletContractV2";
import {KeyPair} from "@ton/crypto";
import {API, createApi} from "../client/api";
import {Sender} from "@ton/core";

const WORKCHAIN = 0;

export type WalletType = 'highload-v2';

export function createHighloadV2(publicKey: Buffer) {
    return HighloadWalletContractV2.create({workchain: WORKCHAIN, publicKey: publicKey});
}

export function createWallet(walletType: WalletType, publicKey: Buffer) {
    switch (walletType) {
        case 'highload-v2':
            return createHighloadV2(publicKey);
        default:
            throw new Error('Unsupported wallet type');
    }
}

export async function createSender(walletType: WalletType, keypair: KeyPair, network: 'testnet' | 'mainnet'): Promise<Sender>;
export async function createSender(walletType: WalletType, keypair: KeyPair, client: API): Promise<Sender>;
export async function createSender(walletType: WalletType, keypair: KeyPair, clientOrNetwork: API | 'testnet' | 'mainnet'): Promise<Sender> {
    const isNetwork = clientOrNetwork === 'testnet' || clientOrNetwork === 'mainnet';
    const client = isNetwork ? await createApi(clientOrNetwork) : clientOrNetwork;
    const wallet = createWallet(walletType, keypair.publicKey);
    return client.openExtended(wallet).sender(keypair.secretKey);
}
