import { SenderArguments, internal } from "@ton/core";
import { WalletContractV4 } from "@ton/ton";
import { importKey } from "./key";
import { ExtendedContractProvider } from "./ExtendedContractProvider";
import { HighloadWalletV2 } from "./HighloadV2";
import { sendAndWait } from "./send";

export async function createHighloadV2(key: string | string[] | Buffer) {
    const wk = await importKey(key);
    const wallet = HighloadWalletV2.create({
        workchain: 0,
        publicKey: wk.publicKey,
    });
    return {
        wallet,
        keyPair: wk,
        senderCreator: (provider: ExtendedContractProvider) => {
            return {
                send: async (args: SenderArguments) => {
                    await wallet.sendTransferAndWait(provider, {
                        secretKey: wk.secretKey,
                        sendMode: args.sendMode,
                        messages: [internal({
                            to: args.to,
                            value: args.value,
                            bounce: args.bounce,
                            init: args.init,
                            body: args.body,
                        })],
                    })
                },
                address: wallet.address,
            };
        },
    };
}

export async function createWalletV4(key: string | string[] | Buffer) {
    const wk = await importKey(key);
    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: wk.publicKey,
    });
    return {
        wallet,
        keyPair: wk,
        senderCreator: (provider: ExtendedContractProvider) => {
            return {
                send: async (args: SenderArguments) => {
                    await sendAndWait(wallet, provider, wk.secretKey, args);
                },
                address: wallet.address,
            };
        },
    };
}
