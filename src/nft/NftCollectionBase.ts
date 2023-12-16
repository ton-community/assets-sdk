import { Contract, Address, Sender, Cell, ContractProvider, beginCell, Dictionary, toNano, SendMode, Builder } from "@ton/core";
import { ExtendedContractProvider } from "../ExtendedContractProvider";
import { NoSenderError } from "../error";
import { NftItem } from "./NftItem";
import { MintRequest, BatchMintRequest, SingleMintRequest, NftCollectionData } from "./data";

function storeSingleMintRequest<T>(request: SingleMintRequest<T>, storeParams: (params: T) => Cell): (builder: Builder) => void {
    return (builder: Builder) => {
        builder
            .storeCoins(request.value ?? toNano('0.03'))
            .storeRef(request.itemParams instanceof Cell ? request.itemParams : storeParams(request.itemParams))
    };
}

export abstract class NftCollectionBase<T> implements Contract {
    static code = Cell.fromBase64('te6cckECEwEAAf4AART/APSkE/S88sgLAQIBYgIDAgLNBAUCASANDgPr0QY4BIrfAA6GmBgLjYSK3wfSAYAOmP6Z/2omh9IGmf6mpqGEEINJ6cqClAXUcUG6+CgOhBCFRlgFa4QAhkZYKoAueLEn0BCmW1CeWP5Z+A54tkwCB9gHAbKLnjgvlwyJLgAPGBEuABcYEZAmAB8YEvgsIH+XhAYHCAIBIAkKAGA1AtM/UxO78uGSUxO6AfoA1DAoEDRZ8AaOEgGkQ0PIUAXPFhPLP8zMzMntVJJfBeIApjVwA9QwjjeAQPSWb6UgjikGpCCBAPq+k/LBj96BAZMhoFMlu/L0AvoA1DAiVEsw8AYjupMCpALeBJJsIeKz5jAyUERDE8hQBc8WE8s/zMzMye1UACgB+kAwQUTIUAXPFhPLP8zMzMntVAIBIAsMAD1FrwBHAh8AV3gBjIywVYzxZQBPoCE8trEszMyXH7AIAC0AcjLP/gozxbJcCDIywET9AD0AMsAyYAAbPkAdMjLAhLKB8v/ydCACASAPEAAlvILfaiaH0gaZ/qamoYLehqGCxABDuLXTHtRND6QNM/1NTUMBAkXwTQ1DHUMNBxyMsHAc8WzMmAIBIBESAC+12v2omh9IGmf6mpqGDYg6GmH6Yf9IBhAALbT0faiaH0gaZ/qamoYCi+CeAI4APgCwWurO9Q==');

    constructor(public readonly address: Address, public sender?: Sender, public readonly init?: { code: Cell, data: Cell }) {}

    async getItemAddress(provider: ContractProvider, index: bigint) {
        return (await provider.get('get_nft_address_by_index', [{ type: 'int', value: index }])).stack.readAddress();
    }

    async getItem(provider: ExtendedContractProvider, index: bigint) {
        return provider.reopen(new NftItem(await this.getItemAddress(provider, index), this.sender));
    }

    abstract paramsToCell(params: T): Cell

    mintMessage(request: MintRequest<T>): Cell {
        return beginCell()
            .storeUint(1, 32)
            .storeUint(request.queryId ?? 0, 64)
            .storeUint(request.itemIndex, 64)
            .storeWritable(storeSingleMintRequest(request, this.paramsToCell))
            .endCell();
    }

    batchMintMessage(request: BatchMintRequest<T>): Cell {
        const dict: Dictionary<bigint, SingleMintRequest<T>> = Dictionary.empty(Dictionary.Keys.BigUint(64), {
            serialize: (r, b) => storeSingleMintRequest(r, this.paramsToCell)(b),
            parse: () => { throw new Error('Unsupported'); },
        });
        for (const r of request.requests) {
            if (dict.has(r.itemIndex)) {
                throw new Error('Duplicate items');
            }
            dict.set(r.itemIndex, r);
        }

        return beginCell()
            .storeUint(2, 32)
            .storeUint(request.queryId ?? 0, 64)
            .storeRef(beginCell().storeDictDirect(dict))
            .endCell();
    }

    async sendMint(provider: ContractProvider, request: MintRequest<T>) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        await provider.internal(this.sender, {
            value: request.requestValue ?? toNano('0.05'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: this.mintMessage(request),
        });
    }

    async sendBatchMint(provider: ContractProvider, request: BatchMintRequest<T>) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        await provider.internal(this.sender, {
            value: request.requestValue ?? toNano('0.05'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: this.batchMintMessage(request),
        });
    }

    async sendDeploy(provider: ContractProvider, value: bigint) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        await provider.internal(this.sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            bounce: true,
        })
    }

    async sendChangeAdmin(provider: ContractProvider, params: {
        newAdmin: Address,
        value: bigint,
        queryId?: bigint
    }) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        await provider.internal(this.sender, {
            value: params.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            bounce: true,
            body: beginCell()
                .storeUint(3, 32)
                .storeUint(params.queryId ?? 0, 64)
                .storeAddress(params.newAdmin)
                .endCell(),
        })
    }

    async sendChangeContent(provider: ContractProvider, params: {
        newContent: Cell,
        newRoyaltyParams: Cell,
        value: bigint,
        queryId?: bigint,
    }) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        await provider.internal(this.sender, {
            value: params.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            bounce: true,
            body: beginCell()
                .storeUint(4, 32)
                .storeUint(params.queryId ?? 0, 64)
                .storeRef(params.newContent)
                .storeRef(params.newRoyaltyParams)
                .endCell(),
        })
    }

    async getData(provider: ContractProvider): Promise<NftCollectionData> {
        const ret = await provider.get('get_collection_data', []);
        return {
            nextItemIndex: ret.stack.readBigNumber(),
            content: ret.stack.readCell(),
            owner: ret.stack.readAddressOpt(),
        };
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
