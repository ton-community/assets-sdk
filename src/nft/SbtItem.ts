import {Address, Cell, Contract, ContractProvider, Sender} from "@ton/core";
import {NftItemData} from "./data";
import {ContentResolver, loadFullContent} from "../content";
import {ExtendedContractProvider} from "../client/ExtendedContractProvider";
import {NftCollection, NftRoyaltyParams} from "./NftCollection";
import {parseNftContent} from "./content";
import {sbtItemCode} from './contracts/build/sbt-item';

export class SbtItem implements Contract {
    static sbtCode = Cell.fromBase64(sbtItemCode.codeBoc);

    constructor(public readonly address: Address, public sender?: Sender, public contentResolver?: ContentResolver) {
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

    async getContent(provider: ExtendedContractProvider) {
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
            const collectionContract = provider.reopen(NftCollection.open(collection, this.sender, this.contentResolver));
            content = await collectionContract.getItemContent(index, individualContent);
        }
        return parseNftContent(await loadFullContent(content, this.contentResolver));
    }

    async getRoyaltyParams(provider: ExtendedContractProvider): Promise<NftRoyaltyParams> {
        const {collection} = await this.getData(provider);
        if (collection === null) {
            // it's means that royalty stored in nft item
            return this.getNftItemRoyaltyParams(provider);
        }

        const collectionContract = provider.reopen(NftCollection.open(collection, this.sender, this.contentResolver));
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
}
