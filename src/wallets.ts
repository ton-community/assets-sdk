import {ContractProvider, internal, SenderArguments} from "@ton/core";
import {importKey} from "./key";
import {HighloadWalletContractV2} from "./wallets/HighloadWalletContractV2";

export async function createHighloadV2(key: string | string[] | Buffer) {
    const wk = await importKey(key);
    const wallet = HighloadWalletContractV2.create({workchain: 0, publicKey: wk.publicKey});
    return {
        wallet,
        keyPair: wk,
        senderCreator: (provider: ContractProvider) => {
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
