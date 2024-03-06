import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    StateInit,
    toNano,
    TupleBuilder
} from "@ton/core";
import {JettonWallet} from "./JettonWallet";
import {ContentResolver, loadFullContent} from "../content";
import {parseJettonContent} from "./content";
import {jettonMinterCode} from './contracts/build/jetton-minter';
import {PartialBy} from "../utils";
import {parseExcessReturnOptions, parseNotifyOptions, SendTransferOptions} from "../common/types";
import {storeJettonMintMessage} from "./types/JettonMintMessage";
import {JettonMinterContent, storeJettonMinterContent} from "./types/JettonMinterContent";
import {storeJettonChangeAdminMessage} from "./types/JettonChangeAdminMessage";
import {storeJettonChangeContentMessage} from "./types/JettonChangeContentMessage";
import {JettonMinterAction, parseJettonMinterTransaction} from "./types/JettonMinterAction";
import {JettonMinterData} from "./types/JettonMinterData";

export type JettonMinterConfig = PartialBy<JettonMinterContent, 'jettonWalletCode'>;

export function jettonMinterConfigToCell(config: JettonMinterConfig): Cell {
    return beginCell().store(storeJettonMinterContent({
        admin: config.admin,
        content: config.content,
        jettonWalletCode: config.jettonWalletCode ?? JettonWallet.code,
    })).endCell();
}

export class JettonMinter implements Contract {
    static code = Cell.fromBase64(jettonMinterCode.codeBoc);

    constructor(public readonly address: Address, public readonly init?: StateInit, public readonly contentResolver?: ContentResolver) {
    }

    static createFromAddress(address: Address, contentResolver?: ContentResolver): JettonMinter {
        return new JettonMinter(address, undefined, contentResolver);
    }

    static createFromConfig(config: JettonMinterConfig, code?: Cell, workchain?: number, contentResolver?: ContentResolver) {
        const data = jettonMinterConfigToCell(config);
        const init = {data, code: code ?? JettonMinter.code};
        return new JettonMinter(contractAddress(workchain ?? 0, init), init, contentResolver);
    }

    async sendDeploy(provider: ContractProvider, sender: Sender, value?: bigint) {
        await provider.internal(sender, {
            value: value ?? toNano('0.05'),
            bounce: true,
        })
    }

    async sendMint(provider: ContractProvider, sender: Sender, recipient: Address, amount: bigint, options?: SendTransferOptions & {
        value?: bigint,
        queryId?: bigint
    }) {
        const notification = parseNotifyOptions(options?.notify);
        const excessReturn = parseExcessReturnOptions(options?.returnExcess, sender);

        await provider.internal(sender, {
            value: options?.value ?? toNano('0.05'),
            bounce: true,
            body: beginCell().store(storeJettonMintMessage({
                queryId: options?.queryId ?? 0n,
                amount: amount,
                from: this.address,
                to: recipient,
                responseAddress: excessReturn?.address ?? null,
                forwardPayload: notification?.payload ?? null,
                forwardTonAmount: notification?.amount ?? 0n,
                walletForwardValue: (notification?.amount ?? 0n) + (excessReturn ? toNano('0.01') : 0n) + toNano(0.02),
            })).endCell(),
        })
    }

    async sendChangeAdmin(provider: ContractProvider, sender: Sender, newAdmin: Address, options?: {
        value?: bigint,
        queryId?: bigint
    }) {
        await provider.internal(sender, {
            value: options?.value ?? toNano('0.05'),
            bounce: true,
            body: beginCell().store(storeJettonChangeAdminMessage({
                queryId: options?.queryId ?? 0n,
                newAdmin: newAdmin,
            })).endCell(),
        });
    }

    async sendChangeContent(provider: ContractProvider, sender: Sender, newContent: Cell, options?: {
        value?: bigint,
        queryId?: bigint
    }) {
        await provider.internal(sender, {
            value: options?.value ?? toNano('0.05'),
            bounce: true,
            body: beginCell().store(storeJettonChangeContentMessage({
                queryId: options?.queryId ?? 0n,
                newContent: newContent,
            })).endCell(),
        })
    }

    async getData(provider: ContractProvider): Promise<JettonMinterData> {
        const builder = new TupleBuilder();
        const {stack} = await provider.get('get_jetton_data', builder.build());
        return {
            totalSupply: stack.readBigNumber(),
            mintable: stack.readBigNumber() !== 0n,
            adminAddress: stack.readAddressOpt(),
            jettonContent: stack.readCell(),
            jettonWalletCode: stack.readCell(),
        };
    }

    async getWalletAddress(provider: ContractProvider, owner: Address) {
        const builder = new TupleBuilder();
        builder.writeAddress(owner);
        const {stack} = await provider.get('get_wallet_address', builder.build());
        return stack.readAddress();
    }

    async getWallet(provider: ContractProvider, owner: Address) {
        const jettonWalletAddress = await this.getWalletAddress(provider, owner);
        return provider.open(new JettonWallet(jettonWalletAddress));
    }

    async getContent(provider: ContractProvider) {
        if (!this.contentResolver) {
            throw new Error('No content resolver');
        }

        const data = await this.getData(provider);
        return parseJettonContent(await loadFullContent(data.jettonContent, this.contentResolver));
    }

    async getActions(provider: ContractProvider, options?: { lt?: never, hash?: never, limit?: number } | {
        lt: bigint,
        hash: Buffer,
        limit?: number
    }): Promise<JettonMinterAction[]> {
        let {lt, hash, limit} = options ?? {};
        if (!lt || !hash) {
            const state = await provider.getState();
            if (!state.last) {
                return [];
            }

            lt = state.last.lt;
            hash = state.last.hash;
        }

        const transactions = await provider.getTransactions(this.address, lt, hash, limit);

        return transactions.map(tx => parseJettonMinterTransaction(tx));
    }
}
