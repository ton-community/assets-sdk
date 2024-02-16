import {
    Address,
    beginCell,
    Cell,
    Contract, contractAddress,
    ContractProvider,
    Sender,
    SendMode, StateInit,
    toNano, Transaction
} from "@ton/core";
import {NftItemData} from "./data";
import {ContentResolver, loadFullContent} from "../content";
import {NftCollection, } from './NftCollection';
import {NftItemParams, NftRoyaltyParams, storeNftItemParams} from "./NftCollection.data";
import {parseNftContent} from "./content";
import {nftItemCode} from './contracts/build/nft-item';
import {loadNftMessage, NftMessage, storeNftTransferMessage} from "./NftItem.tlb";
import {parseExcessReturnOptions, parseNotifyOptions, SendTransferOptions} from "../common/types";

export type NftItemConfig = {
    index: bigint;
    collection: Address;
};

export function nftItemConfigToCell(config: NftItemConfig): Cell {
    return beginCell()
        .storeUint(config.index, 64)
        .storeAddress(config.collection)
        .endCell();
}

export class NftItem implements Contract {
    static nftCode = Cell.fromBase64(nftItemCode.codeBoc);

    constructor(public readonly address: Address, public readonly init?: StateInit, public contentResolver?: ContentResolver) {
    }

    static createFromConfig(config: NftItemConfig, code?: Cell, workchain?: number, contentResolver?: ContentResolver) {
        const data = nftItemConfigToCell(config);
        const init = {data, code: code ?? NftItem.nftCode};
        return new NftItem(contractAddress(workchain ?? 0, init), init, contentResolver);
    }

    static createFromAddress(address: Address, contentResolver?: ContentResolver) {
        return new NftItem(address, undefined, contentResolver);
    }

    async sendDeploy(provider: ContractProvider, sender: Sender, params: NftItemParams, value?: bigint) {
        await provider.internal(sender, {
            value: value ?? toNano('0.03'),
            bounce: true,
            body: beginCell().store(storeNftItemParams(params)).endCell(),
        });
    }

    async send(provider: ContractProvider, sender: Sender, newOwner: Address, options?: SendTransferOptions, value?: bigint, queryId?: bigint) {
        const notification = parseNotifyOptions(options?.notify);
        const excessReturn = parseExcessReturnOptions(options?.returnExcess, sender);

        await provider.internal(sender, {
            value: value ?? toNano('0.03'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeNftTransferMessage({
                queryId: queryId ?? 0n,
                newOwner: newOwner,
                responseDestination: excessReturn?.address ?? null,
                customPayload: null,
                forwardAmount: notification?.amount ?? 0n,
                forwardPayload: notification?.payload ?? null,
            })).endCell()
        });
    }

    async getData(provider: ContractProvider): Promise<NftItemData> {
        const {stack} = await provider.get('get_nft_data', []);
        return {
            initialized: stack.readBoolean(),
            index: stack.readBigNumber(),
            collection: stack.readAddressOpt(),
            owner: stack.readAddressOpt(),
            individualContent: stack.readCellOpt(),
        };
    }

    async getContent(provider: ContractProvider) {
        if (this.contentResolver === undefined) {
            throw new Error('No content resolver');
        }
        const {collection, individualContent, index} = await this.getData(provider);
        if (individualContent === null) {
            throw new Error('Individual content is null');
        }
        let content: Cell;
        if (collection === null) {
            content = individualContent;
        } else {
            const collectionContract = provider.open(NftCollection.createFromAddress(collection, this.contentResolver));
            content = await collectionContract.getItemContent(index, individualContent);
        }
        return parseNftContent(await loadFullContent(content, this.contentResolver));
    }

    async getRoyaltyParams(provider: ContractProvider): Promise<NftRoyaltyParams> {
        const {collection} = await this.getData(provider);
        if (collection === null) {
            // it's means that royalty stored in nft item
            return this.getNftItemRoyaltyParams(provider);
        }

        const collectionContract = provider.open(NftCollection.createFromAddress(collection, this.contentResolver));
        return collectionContract.getRoyaltyParams();
    }

    async getNftItemRoyaltyParams(provider: ContractProvider): Promise<NftRoyaltyParams> {
        const {stack} = await provider.get('get_royalty_params', []);
        return {
            numerator: stack.readBigNumber(),
            denominator: stack.readBigNumber(),
            recipient: stack.readAddress(),
        };
    }

    async getMessages(provider: ContractProvider): Promise<ParsedTransaction<NftMessage>[]>;
    async getMessages(provider: ContractProvider, lt?: undefined | null, hash?: undefined | null): Promise<ParsedTransaction<NftMessage>[]>;
    async getMessages(provider: ContractProvider, lt: bigint, hash: Buffer): Promise<ParsedTransaction<NftMessage>[]>;
    async getMessages(provider: ContractProvider, lt?: bigint | null, hash?: Buffer | null): Promise<ParsedTransaction<NftMessage>[]> {
        if (lt === undefined || lt === null || hash === undefined || hash === null) {
            const state = await provider.getState();
            if (!state.last) {
                return [];
            }

            lt ??= state.last.lt;
            hash ??= state.last.hash;
        }

        const transactions = await provider.getTransactions(this.address, lt, hash);

        const parsed: ParsedTransaction<NftMessage>[] = [];
        for (const tx of transactions) {
            if (tx.description.type !== 'generic') {
                parsed.push({inMessage: null, outMessages: [], transaction: tx});
                continue;
            }
            if (!tx.inMessage) {
                parsed.push({inMessage: null, outMessages: [], transaction: tx});
                continue;
            }
            if (tx.inMessage.info.type !== 'internal') {
                parsed.push({inMessage: null, outMessages: [], transaction: tx});
                continue;
            }
            if (tx.description.computePhase.type !== 'vm') {
                parsed.push({inMessage: null, outMessages: [], transaction: tx});
                continue;
            }
            if (tx.description.computePhase.exitCode !== 0) {
                parsed.push({inMessage: null, outMessages: [], transaction: tx});
                continue;
            }

            const inMessage = loadNftMessage(tx.inMessage.body.beginParse());

            const outMessages: NftMessage[] = [];
            for (const outMessage of tx.outMessages.values()) {
                const message = loadNftMessage(outMessage.body.beginParse());
                outMessages.push(message);
            }

            parsed.push({inMessage, outMessages, transaction: tx});
        }

        return parsed;
    }
}

export type ParsedTransaction<T> = {
    inMessage: T | null;
    outMessages: T[];
    transaction: Transaction;
};
