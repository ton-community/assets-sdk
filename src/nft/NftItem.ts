import {
    Address,
    beginCell,
    Builder,
    Cell,
    Contract,
    ContractProvider,
    Sender,
    SendMode,
    Slice,
    toNano
} from "@ton/core";
import {NoSenderError} from "../error";
import {NftItemData} from "./data";
import {ContentResolver, loadFullContent} from "../content";
import {ExtendedContractProvider} from "../client/ExtendedContractProvider";
import {NftCollection, NftRoyaltyParams} from "./NftCollection";
import {parseNftContent} from "./content";
import {nftItemCode} from './contracts/build/nft-item';

export type NftTransferMessage = {
    queryId?: bigint | null;
    newOwner: Address;
    responseDestination?: Address | null;
    customPayload?: Cell | null;
    forwardAmount?: bigint | null;
    forwardPayload?: Cell | null;
};

export function storeNftTransferMessage(message: NftTransferMessage): (builder: Builder) => void {
    return (builder) => {
        const {queryId, newOwner, responseDestination, customPayload, forwardAmount, forwardPayload} = message;
        const OPCODE_TRANSFER = 0x5fcc3d14;
        builder.storeUint(OPCODE_TRANSFER, 32)
            .storeUint(queryId ?? 0, 64)
            .storeAddress(newOwner)
            .storeAddress(responseDestination)
            .storeMaybeRef(customPayload)
            .storeCoins(forwardAmount ?? 0)
            .storeMaybeRef(forwardPayload);
    };
}

export function loadNftTransferMessage(slice: Slice): NftTransferMessage {
    const OPCODE_TRANSFER = 0x5fcc3d14;
    if (slice.loadUint(32) !== OPCODE_TRANSFER) {
        throw new Error('Wrong opcode');
    }
    const queryId = slice.loadUintBig(64);
    const newOwner = slice.loadAddress();
    const responseDestination = slice.loadMaybeAddress();
    const customPayload = slice.loadMaybeRef();
    const forwardAmount = slice.loadCoins();
    const forwardPayload = slice.loadMaybeRef();
    return {
        queryId,
        newOwner,
        responseDestination,
        customPayload,
        forwardAmount,
        forwardPayload,
    };
}

export class NftItem implements Contract {
    static nftCode = Cell.fromBase64(nftItemCode.codeBoc);

    constructor(public readonly address: Address, public sender?: Sender, public contentResolver?: ContentResolver) {
    }

    async sendTransfer(provider: ContractProvider, message: NftTransferMessage, args?: {
        value?: bigint,
        bounce?: boolean
    }) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }

        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.03'),
            bounce: args?.bounce ?? true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeNftTransferMessage({
                queryId: message.queryId,
                newOwner: message.newOwner,
                responseDestination: message.responseDestination ?? this.sender.address,
                customPayload: message.customPayload,
                forwardAmount: message.forwardAmount,
                forwardPayload: message.forwardPayload,
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
