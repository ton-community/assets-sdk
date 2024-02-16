import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    StateInit,
    toNano
} from "@ton/core";
import {NftItemData} from "./data";
import {ContentResolver, loadFullContent} from "../content";
import {NftCollection} from "./NftCollection";
import {parseNftContent} from "./content";
import {sbtItemCode} from './contracts/build/sbt-item';
import {SbtItemParams, storeSbtItemParams} from "./SbtCollection.data";

export type SbtItemConfig = {
    index: bigint;
    collection: Address;
};

export function sbtItemConfigToCell(config: SbtItemConfig): Cell {
    return beginCell()
        .storeUint(config.index, 64)
        .storeAddress(config.collection)
        .endCell();
}

export class SbtItem implements Contract {
    static sbtCode = Cell.fromBase64(sbtItemCode.codeBoc);

    constructor(public readonly address: Address, public readonly init?: StateInit, public contentResolver?: ContentResolver) {
    }

    static createFromConfig(config: SbtItemConfig, code?: Cell, workchain?: number, contentResolver?: ContentResolver) {
        const data = sbtItemConfigToCell(config);
        const init = {data, code: code ?? SbtItem.sbtCode};
        return new SbtItem(contractAddress(workchain ?? 0, init), init, contentResolver);
    }

    static createFromAddress(address: Address, contentResolver?: ContentResolver) {
        return new SbtItem(address, undefined, contentResolver);
    }

    async sendDeploy(provider: ContractProvider, sender: Sender, params: SbtItemParams, value?: bigint) {
        await provider.internal(sender, {
            value: value ?? toNano('0.03'),
            bounce: true,
            body: beginCell().store(storeSbtItemParams(params)).endCell(),
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
}
