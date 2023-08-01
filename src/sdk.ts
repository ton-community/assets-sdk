import { Address, Sender, toNano, beginCell, Dictionary } from "ton-core";
import { PinataStorage, Storage } from "./storage";
import { API } from "./api";
import { mnemonicToWalletKey, sha256_sync } from "ton-crypto";
import { ExtendedTonClient4 } from "./ExtendedTonClient4";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { sendAndWait } from "./send";
import { WalletContractV4 } from "ton";
import { JettonContent, jettonContentToInternal } from "./jetton/content";
import { Jetton } from "./jetton/contracts";
import { MintRequest } from "./jetton/data";

export class GameFiSDK {
    constructor(public readonly storage: Storage, public readonly api: API, public readonly sender?: Sender) {}

    static async create(params: {
        storage: {
            pinataApiKey: string
            pinataSecretKey: string
        } | Storage,
        api: 'mainnet' | 'testnet' | API,
        wallet?: string | Sender,
    }) {
        let storage: Storage;
        if ('pinataApiKey' in params.storage) {
            storage = new PinataStorage(params.storage.pinataApiKey, params.storage.pinataSecretKey);
        } else {
            storage = params.storage;
        }

        let api: API;
        if (params.api === 'mainnet' || params.api === 'testnet') {
            const tc4 = new ExtendedTonClient4({ endpoint: await getHttpV4Endpoint({ network: params.api }), timeout: 15000 });
            api = { open: (contract) => tc4.openExtended(contract), provider: (addr, init) => tc4.provider(addr, init) };
        } else {
            api = params.api;
        }

        let sender: Sender | undefined = undefined;
        if (params.wallet !== undefined) {
            if (typeof params.wallet === 'string') {
                const mnemonic = params.wallet.split(' ');
                const wk = await mnemonicToWalletKey(mnemonic);
                const wallet = WalletContractV4.create({
                    workchain: 0,
                    publicKey: wk.publicKey,
                });
                const provider = api.provider(wallet.address, wallet.init);
                sender = {
                    send: async (args) => {
                        await sendAndWait(wallet, provider, wk.secretKey, args);
                    },
                    address: wallet.address,
                };
            } else {
                sender = params.wallet;
            }
        }

        return new GameFiSDK(storage, api, sender);
    }

    async createJetton(content: JettonContent, options?: {
        onchainContent?: boolean,
        adminAddress?: Address,
        premint?: Exclude<MintRequest, 'requestValue'>,
        value?: bigint,
    }) {
        const adminAddress = options?.adminAddress ?? this.sender?.address;
        if (adminAddress === undefined) {
            throw new Error('Admin address must be defined in options or be available in Sender');
        }
        const jetton = this.api.open(Jetton.create({
            admin: adminAddress,
            content: await this.jettonContentToCell(content, options?.onchainContent ?? false),
        }, this.sender));
        const value = options?.value ?? toNano('0.05');
        if (options?.premint === undefined) {
            await jetton.sendDeploy(value);
        } else {
            await jetton.sendMint({
                ...options.premint,
                requestValue: value,
            });
        }
        return jetton;
    }

    private async jettonContentToCell(content: JettonContent, onchain: boolean) {
        const internal = jettonContentToInternal(content);
        if (onchain) {
            const dict = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());
            for (const k in internal) {
                if ((internal as any)[k] === undefined) {
                    continue;
                }
                const b = beginCell();
                if (k === 'image_data') {
                    const chunks = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Cell());
                    const buf = Buffer.from((internal as any)[k], 'base64');
                    for (let i = 0; i * 127 < buf.length; i++) {
                        chunks.set(i, beginCell().storeBuffer(buf.subarray(i * 127, (i + 1) * 127)).endCell());
                    }
                    b.storeUint(1, 8).storeDict(chunks).endCell();
                } else {
                    b.storeUint(0, 8).storeStringTail((internal as any)[k].toString());
                }
                dict.set(sha256_sync(k), b.endCell());
            }
            return beginCell().storeUint(0, 8).storeDict(dict).endCell();
        } else {
            const contentUrl = await this.storage.uploadFile(Buffer.from(JSON.stringify(internal), 'utf-8'));
            return beginCell()
                .storeUint(0x01, 8)
                .storeStringTail(contentUrl)
                .endCell();
        }
    }
}
