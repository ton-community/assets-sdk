import { Contract, Address, Sender, ContractProvider, toNano, SendMode, beginCell, Cell, Slice, Transaction } from "@ton/core";
import { NoSenderError } from "../error";
import {NftTransferRequest, NftItemData, NftTransferBody, NftTransfer} from "./data";
import { ContentResolver, loadFullContent } from "../content";
import { ExtendedContractProvider } from "../ExtendedContractProvider";
import {NftCollection, NftRoyaltyParams} from "./NftCollection";
import { parseNftContent } from "./content";
import {nftItemCode} from './contracts/build/nft-item';
import {sbtItemCode} from './contracts/build/sbt-item';

export class NftItem implements Contract {
    static nftCode = Cell.fromBase64(nftItemCode.codeBoc);
    static sbtCode = Cell.fromBase64(sbtItemCode.codeBoc);

    constructor(public readonly address: Address, public sender?: Sender, public contentResolver?: ContentResolver) {}

    async sendTransfer(provider: ContractProvider, request: NftTransferRequest) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        const response = request.responseDestination ?? this.sender.address;
        await provider.internal(this.sender, {
            value: request.value ?? toNano('0.03'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x5fcc3d14, 32)
                .storeUint(request.queryId ?? 0, 64)
                .storeAddress(request.to)
                .storeAddress(response)
                .storeMaybeRef(request.customPayload)
                .storeCoins(request.forwardAmount ?? 0)
                .storeMaybeRef(request.forwardPayload)
                .endCell(),
        });
    }

    async getData(provider: ContractProvider): Promise<NftItemData> {
        const { stack } = await provider.get('get_nft_data', []);
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
        const { collection, individualContent, index } = await this.getData(provider);
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
        const { collection} = await this.getData(provider);
        if (collection === null) {
            // it's means that royalty stored in nft item
            return this.getNftItemRoyaltyParams(provider);
        }

        const collectionContract = provider.reopen(NftCollection.open(collection, this.sender, this.contentResolver));
        return collectionContract.getRoyaltyParams();
    }

    async getNftItemRoyaltyParams(provider: ContractProvider): Promise<NftRoyaltyParams> {
        const { stack } = await provider.get('get_royalty_params', []);
        return {
            numerator: stack.readBigNumber(),
            denominator: stack.readBigNumber(),
            recipient: stack.readAddress(),
        };
    }

    static parseTransferBody(body: Cell | Slice): NftTransferBody {
        if (body instanceof Cell) {
            body = body.beginParse();
        }
        if (body.loadUint(32) !== 0x0f8a7ea5) {
            throw new Error('Wrong opcode');
        }
        const queryId = body.loadUintBig(64);
        const newOwner = body.loadAddress();
        const responseDestination = body.loadMaybeAddress();
        const customPayload = body.loadMaybeRef();
        const forwardAmount = body.loadCoins();
        const forwardPayloadIsRight = body.loadBoolean();
        const forwardPayload = forwardPayloadIsRight ? body.loadRef() : body.asCell();
        return {
            queryId,
            newOwner,
            responseDestination,
            customPayload,
            forwardAmount,
            forwardPayload,
        };
    }

    static parseTransfer(tx: Transaction): NftTransfer {
        if (tx.inMessage?.info.type !== 'internal') {
            throw new Error('Message must be internal');
        }
        if (tx.description.type !== 'generic') {
            throw new Error('Transaction must be generic');
        }
        const body = this.parseTransferBody(tx.inMessage.body);
        return {
            ...body,
            success: (tx.description.computePhase.type === 'vm' && tx.description.computePhase.success && tx.description.actionPhase?.success) ?? false,
            value: tx.inMessage.info.value.coins,
        };
    }
}
