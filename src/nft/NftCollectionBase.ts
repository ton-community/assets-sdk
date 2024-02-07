import {
    Address,
    beginCell,
    Builder,
    Cell,
    Contract,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode,
    Slice,
    toNano,
    DictionaryValue
} from "@ton/core";
import {ExtendedContractProvider} from "../ExtendedContractProvider";
import {NoSenderError} from "../error";
import {NftItem} from "./NftItem";
import {NftCollectionData} from "./data";
import {ContentResolver, loadFullContent} from "../content";
import {parseNftContent} from "./content";
import {nftCollectionEditableCode} from './contracts/build/nft-collection-editable';

export type NftMintMessage<T> = {
    itemIndex: bigint,
    value?: bigint,
    itemParams: T,
    queryId?: bigint,
}

export function storeNftMintMessage<T>(src: NftMintMessage<T>, storeParams: (params: T) => (builder: Builder) => void): (builder: Builder) => void {
    return (builder: Builder) => {
        const mintOpcode = 1;

        builder.storeUint(mintOpcode, 32);
        builder.storeUint(src.queryId ?? 0, 64);
        builder.storeUint(src.itemIndex, 64);
        builder.storeCoins(src.value ?? toNano('0.03'));
        builder.storeRef(beginCell().store(storeParams(src.itemParams)).endCell());
    };
}

export function loadNftMintMessage<T>(slice: Slice, loadParams: (slice: Slice) => T): NftMintMessage<T> {
    const mintOpcode = 1;
    if (slice.loadUint(32) !== mintOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const itemIndex = slice.loadUintBig(64);
    const value = slice.loadCoins();
    const itemParams = slice.loadRef();
    return {
        itemIndex,
        value,
        itemParams: loadParams(itemParams.beginParse()),
        queryId,
    };
}

export type NftBatchMintItem<T> = {
    itemIndex: bigint,
    value?: bigint,
    itemParams: T,
}

export function storeNftBatchMintItem<T>(request: NftBatchMintItem<T>, storeParams: (src: T) => (builder: Builder) => void): (builder: Builder) => void {
    return (builder: Builder) => {
        builder.storeCoins(request.value ?? toNano('0.03'));
        builder.storeRef(beginCell().store(storeParams(request.itemParams)).endCell());
    };
}

export function loadNftBatchMintItem<T>(slice: Slice, loadParams: (slice: Slice) => T): NftBatchMintItem<T> {
    const itemIndex = slice.loadUintBig(64);
    const value = slice.loadCoins();
    const itemParams = slice.loadRef();
    return {
        itemIndex,
        value,
        itemParams: loadParams(itemParams.beginParse()),
    };
}

export function createNftMintItemValue<T>(
    storeParams?: (params: T) => (builder: Builder) => void,
    loadParams?: (slice: Slice) => T
): DictionaryValue<NftBatchMintItem<T>> {
    return {
        serialize(src: NftBatchMintItem<T>, builder: Builder) {
            if (!storeParams) {
                throw new Error('storeParams is not defined');
            }

            builder.store(storeNftBatchMintItem(src, storeParams));
        },
        parse(src: Slice): NftBatchMintItem<T> {
            if (!loadParams) {
                throw new Error('loadParams is not defined');
            }

            return loadNftBatchMintItem(src, loadParams);
        },
    };
}

export type NftBatchMintMessage<T> = {
    queryId?: bigint,
    requests: NftBatchMintItem<T>[],
}

export function storeNftBatchMintMessage<T>(src: NftBatchMintMessage<T>, storeParams: (src: T) => (builder: Builder) => void): (builder: Builder) => void {
    return (builder: Builder) => {
        const mintOpcode = 2;

        const dict: Dictionary<bigint, NftBatchMintItem<T>> = Dictionary.empty(Dictionary.Keys.BigUint(64), createNftMintItemValue(storeParams));
        for (const r of src.requests) {
            if (dict.has(r.itemIndex)) {
                throw new Error('Duplicate items');
            }
            dict.set(r.itemIndex, r);
        }

        builder.storeUint(mintOpcode, 32);
        builder.storeUint(src.queryId ?? 0, 64);
        builder.storeRef(beginCell().storeDictDirect(dict));
    };
}

export function loadNftBatchMintMessage<T>(slice: Slice, loadParams: (slice: Slice) => T): NftBatchMintMessage<T> {
    const mintOpcode = 2;
    if (slice.loadUint(32) !== mintOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const requests = slice.loadDictDirect(
        Dictionary.Keys.BigUint(64),
        createNftMintItemValue(undefined, loadParams)
    );
    return {
        queryId: queryId,
        requests: requests.values(),
    };
}

type NftChangeAdminMessage = {
    queryId?: bigint
    newAdmin: Address,
};

export function storeNftChangeAdminMessage(src: NftChangeAdminMessage): (builder: Builder) => void {
    return (builder: Builder) => {
        const changeAdminOpcode = 3;
        builder.storeUint(changeAdminOpcode, 32);
        builder.storeUint(src.queryId ?? 0, 64);
        builder.storeAddress(src.newAdmin);
    };
}

export function loadNftChangeAdminMessage(slice: Slice): NftChangeAdminMessage {
    const changeAdminOpcode = 3;
    if (slice.loadUint(32) !== changeAdminOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const newAdmin = slice.loadAddress();
    return {
        queryId,
        newAdmin,
    };
}

type NftChangeContentMessage = {
    queryId?: bigint,
    newContent: Cell,
    newRoyaltyParams: Cell,
}

export function storeNftChangeContentMessage(src: NftChangeContentMessage): (builder: Builder) => void {
    return (builder: Builder) => {
        const changeContentOpcode = 4;
        builder.storeUint(changeContentOpcode, 32);
        builder.storeUint(src.queryId ?? 0, 64);
        builder.storeRef(src.newContent);
        builder.storeRef(src.newRoyaltyParams);
    };
}

export function loadNftChangeContentMessage(slice: Slice): NftChangeContentMessage {
    const changeContentOpcode = 4;
    if (slice.loadUint(32) !== changeContentOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const newContent = slice.loadRef();
    const newRoyaltyParams = slice.loadRef();
    return {
        queryId,
        newContent,
        newRoyaltyParams,
    };
}

export abstract class NftCollectionBase<T> implements Contract {
    static code = Cell.fromBase64(nftCollectionEditableCode.codeBoc);

    public readonly contentResolver?: ContentResolver;

    public readonly storeNftItemParams?: (src: T) => (builder: Builder) => void;

    public readonly loadNftItemParams?: (slice: Slice) => T;

    constructor(public readonly address: Address, public sender?: Sender, public readonly init?: {
        code: Cell,
        data: Cell
    }, contentResolver?: ContentResolver, storeNftItemParams?: (src: T) => (builder: Builder) => void, loadNftItemParams?: (slice: Slice) => T) {
        this.contentResolver = contentResolver;
        this.storeNftItemParams = storeNftItemParams;
        this.loadNftItemParams = loadNftItemParams;
    }

    async sendMint(provider: ContractProvider, message: NftMintMessage<T>, args?: {
        value?: bigint,
        bounce?: boolean
    }) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        if (!this.storeNftItemParams) {
            throw new Error('storeNftItemParams is not defined');
        }

        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.05'),
            bounce: args?.bounce ?? true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeNftMintMessage(message, this.storeNftItemParams)).endCell(),
        });
    }

    async sendBatchMint(provider: ContractProvider, message: NftBatchMintMessage<T>, args?: { value?: bigint, bounce?: boolean }) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }

        if (!this.storeNftItemParams) {
            throw new Error('storeNftItemParams is not defined');
        }

        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.05'),
            bounce: args?.bounce ?? true,
            body: beginCell().store(storeNftBatchMintMessage(message, this.storeNftItemParams)).endCell(),
        });
    }

    async sendDeploy(provider: ContractProvider, args?: {value?: bigint, bounce?: boolean}) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.05'),
            bounce: args?.bounce ?? true,
        });
    }

    async sendChangeAdmin(provider: ContractProvider, message: NftChangeAdminMessage, args?: {value?: bigint, bounce?: boolean}) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }

        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.05'),
            bounce: args?.bounce ?? true,
            body: beginCell().store(storeNftChangeAdminMessage(message)).endCell(),
        });
    }

    async sendChangeContent(provider: ContractProvider, message: NftChangeContentMessage, args?: {value?: bigint, bounce?: boolean}) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }

        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.05'),
            bounce: args?.bounce ?? true,
            body: beginCell().store(storeNftChangeContentMessage(message)).endCell(),
        });
    }

    async getItemAddress(provider: ContractProvider, index: bigint) {
        return (await provider.get('get_nft_address_by_index', [{type: 'int', value: index}])).stack.readAddress();
    }

    async getItem(provider: ExtendedContractProvider, index: bigint) {
        const nftItemAddress = await this.getItemAddress(provider, index);
        return provider.reopen(new NftItem(nftItemAddress, this.sender, this.contentResolver));
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
        return (await provider.get('get_nft_content', [{
            type: 'int',
            value: index,
        }, {
            type: 'cell',
            cell: individualContent,
        }])).stack.readCell();
    }
}
