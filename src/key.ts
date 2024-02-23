import {KeyPair, keyPairFromSecretKey, mnemonicToWalletKey} from "@ton/crypto";

export async function importKey(key: string | string[] | Buffer): Promise<KeyPair> {
    if (typeof key === 'string') {
        return await mnemonicToWalletKey(key.split(' '));
    } else if (Array.isArray(key)) {
        return await mnemonicToWalletKey(key);
    } else {
        return keyPairFromSecretKey(key);
    }
}
