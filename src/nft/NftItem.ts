import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    StateInit,
    toNano
} from "@ton/core";
import {ContentResolver, loadFullContent} from "../content";
import {NftCollection,} from './NftCollection';
import {parseNftContent} from "./content";
import {nftItemCode} from './contracts/build/nft-item';
import {parseExcessReturnOptions, parseNotifyOptions, SendTransferOptions} from "../common/types";
import {NftRoyaltyParams} from "./types/NftRoyaltyParams";
import {NftItemParams, storeNftItemParams} from "./types/NftItemParams";
import {storeNftTransferMessage} from "./types/NftTransferMessage";
import {NftItemAction, parseNftItemTransaction} from "./types/NftItemAction";
import {NftItemData} from "./data";

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
            value: value ?? toNano('0.05'),
            bounce: true,
            body: beginCell().store(storeNftItemParams(params)).endCell(),
        });
    }

    async send(provider: ContractProvider, sender: Sender, newOwner: Address, options?: SendTransferOptions & {
        customPayload?: Cell,
        value?: bigint,
        queryId?: bigint
    }) {
        const notification = parseNotifyOptions(options?.notify);
        const excessReturn = parseExcessReturnOptions(options?.returnExcess, sender);

        await provider.internal(sender, {
            value: (options?.value ?? toNano('0.05')) + (notification?.amount ?? 0n),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeNftTransferMessage({
                queryId: options?.queryId ?? 0n,
                newOwner: newOwner,
                responseDestination: excessReturn?.address ?? null,
                customPayload: options?.customPayload ?? null,
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

    async getActions(provider: ContractProvider, options?: { lt?: never, hash?: never, limit?: number } | {
        lt: bigint,
        hash: Buffer,
        limit?: number
    }): Promise<NftItemAction[]> {
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

        return transactions.map(tx => parseNftItemTransaction(tx));
    }
}
