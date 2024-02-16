import {Address, beginCell, Cell, Contract, ContractProvider, Sender, SendMode, StateInit, toNano} from "@ton/core";
import {NftCollectionData} from "./data";
import {ContentResolver, loadFullContent} from "../content";
import {parseNftContent} from "./content";
import {nftCollectionEditableCode} from './contracts/build/nft-collection-editable';
import {
    NftBatchMintMessage,
    NftChangeAdminMessage,
    NftChangeContentMessage, NftMintItem, NftMintItemParams,
    NftMintMessage,
    storeNftBatchMintMessage,
    storeNftChangeAdminMessage,
    storeNftChangeContentMessage,
    storeNftMintMessage
} from "./NftCollectionBase.data";
import {NftItemParams, ParamsValue, storeNftItemParams} from "./NftCollection.data";

export abstract class NftCollectionBase<T> implements Contract {
    static code = Cell.fromBase64(nftCollectionEditableCode.codeBoc);

    public readonly contentResolver?: ContentResolver;

    public readonly itemParamsValue?: ParamsValue<T>;

    constructor(
        public readonly address: Address,
        public readonly init?: StateInit,
        contentResolver?: ContentResolver,
        nftItemParamsValue?: ParamsValue<T>
    ) {
        this.contentResolver = contentResolver;
        this.itemParamsValue = nftItemParamsValue;
    }

    async sendDeploy(provider: ContractProvider, sender: Sender, value?: bigint) {
        await provider.internal(sender, {
            value: value ?? toNano('0.05'),
            bounce: true,
        });
    }

    async sendMint(provider: ContractProvider, sender: Sender, item: NftMintItemParams<T>, value?: bigint, queryId?: bigint) {
        if (this.itemParamsValue === undefined) {
            throw new Error('No item params value');
        }

        await provider.internal(sender, {
            value: value ?? toNano('0.05'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeNftMintMessage({
                queryId: queryId ?? 0n,
                itemIndex: item.index,
                itemParams: item,
                value: item.value ?? toNano('0.03'),
            }, this.itemParamsValue.store)).endCell(),
        });
    }

    async sendBatchMint(provider: ContractProvider, sender: Sender, items: NftMintItemParams<T>[], value?: bigint, queryId?: bigint) {
        if (this.itemParamsValue === undefined) {
            throw new Error('No item params value');
        }

        await provider.internal(sender, {
            value: value ?? toNano('0.05') * BigInt(items.length),
            bounce: true,
            body: beginCell().store(storeNftBatchMintMessage({
                queryId: queryId ?? 0n,
                requests: items.map((item) => ({
                    index: item.index,
                    params: item,
                    value: item.value ?? toNano('0.03'),
                })),
            }, this.itemParamsValue.store)).endCell(),
        });
    }

    async sendChangeAdmin(provider: ContractProvider, sender: Sender, newAdmin: Address, value?: bigint, queryId?: bigint) {
        await provider.internal(sender, {
            value: value ?? toNano('0.05'),
            bounce: true,
            body: beginCell().store(storeNftChangeAdminMessage({
                newAdmin: newAdmin,
                queryId: queryId ?? 0n,
            })).endCell(),
        });
    }

    async sendChangeContent(provider: ContractProvider, sender: Sender, message: NftChangeContentMessage, value?: bigint, queryId?: bigint) {
        await provider.internal(sender, {
            value: value ?? toNano('0.05'),
            bounce: true,
            body: beginCell().store(storeNftChangeContentMessage(message)).endCell(),
        });
    }

    async getItemAddress(provider: ContractProvider, index: bigint) {
        const ret = await provider.get('get_nft_address_by_index', [{type: 'int', value: index}]);
        return ret.stack.readAddress();
    }

    async getData(provider: ContractProvider): Promise<NftCollectionData> {
        const ret = await provider.get('get_collection_data', []);
        return {
            nextItemIndex: ret.stack.readBigNumber(),
            content: ret.stack.readCell(),
            owner: ret.stack.readAddressOpt(),
        };
    }

    async getContent(provider: ContractProvider) {
        if (this.contentResolver === undefined) {
            throw new Error('No content resolver');
        }
        const data = await this.getData(provider);
        return parseNftContent(await loadFullContent(data.content, this.contentResolver));
    }

    async getItemContent(provider: ContractProvider, index: bigint, individualContent: Cell): Promise<Cell> {
        const res = await provider.get('get_nft_content', [{
            type: 'int',
            value: index,
        }, {
            type: 'cell',
            cell: individualContent,
        }]);
        return res.stack.readCell();
    }
}
