import {
    Address,
    beginCell,
    Builder,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    Slice,
    toNano,
    TupleBuilder
} from "@ton/core";
import {JettonWallet} from "./JettonWallet";
import {ExtendedContractProvider} from "../client/ExtendedContractProvider";
import {NoSenderError} from "../error";
import {ContentResolver, loadFullContent} from "../content";
import {parseJettonContent} from "./content";
import {jettonMinterCode} from './contracts/build/jetton-minter';

export interface JettonMinterData {
    totalSupply: bigint,
    mintable: boolean,
    adminAddress: Address | null,
    jettonContent: Cell,
    jettonWalletCode: Cell,
}

export type JettonMintMessage = {
    queryId?: bigint,
    amount: bigint,
    from?: Address,
    to: Address,
    responseAddress?: Address,
    forwardTonAmount?: bigint,
    forwardPayload?: Cell | null,
    walletForwardValue?: bigint,
}

export function storeJettonMintMessage(src: JettonMintMessage) {
    return (builder: Builder) => {
        const mintOpcode = 21;
        const queryId = src.queryId ?? 0;
        const walletForwardValue = src.walletForwardValue ?? toNano('0.02');

        builder.storeUint(mintOpcode, 32);
        builder.storeUint(queryId, 64);
        builder.storeAddress(src.to);
        builder.storeCoins(walletForwardValue);
        builder.storeRef(beginCell().store(storeJettonInternalTransferMessage(src)).endCell());
    }
}

export function loadJettonMintMessage(slice: Slice): JettonMintMessage {
    const mintOpcode = 21;
    if (slice.loadUint(32) !== mintOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const to = slice.loadAddress();
    const walletForwardValue = slice.loadCoins();
    const internalTransfer = loadJettonInternalTransferMessage(slice.loadRef().beginParse());

    return {
        queryId,
        amount: internalTransfer.amount,
        from: internalTransfer.from,
        to,
        responseAddress: internalTransfer.responseAddress,
        forwardTonAmount: internalTransfer.forwardTonAmount,
        forwardPayload: internalTransfer.forwardPayload,
        walletForwardValue,
    }
}

export type JettonInternalTransferMessage = {
    queryId?: bigint,
    amount: bigint,
    from?: Address,
    responseAddress?: Address,
    forwardTonAmount?: bigint,
    forwardPayload?: Cell | null,
}

export function storeJettonInternalTransferMessage(src: JettonInternalTransferMessage) {
    return (builder: Builder) => {
        const internalTransferOpcode = 0x178d4519;
        const queryId = src.queryId ?? 0;
        const forwardTonAmount = src.forwardTonAmount ?? 0;
        const forwardPayload = src.forwardPayload ?? null;

        builder.storeUint(internalTransferOpcode, 32);
        builder.storeUint(queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.from);
        builder.storeAddress(src.responseAddress);
        builder.storeCoins(forwardTonAmount);
        builder.storeMaybeRef(forwardPayload);
    }
}

export function loadJettonInternalTransferMessage(slice: Slice): JettonInternalTransferMessage {
    const internalTransferOpcode = 0x178d4519;
    if (slice.loadUint(32) !== internalTransferOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const from = slice.loadAddress();
    const responseAddress = slice.loadAddress();
    const forwardTonAmount = slice.loadCoins();
    const forwardPayload = slice.loadMaybeRef();

    return {
        queryId,
        amount,
        from,
        responseAddress,
        forwardTonAmount,
        forwardPayload,
    }
}

export type JettonMinterContent = {
    admin: Address,
    content: Cell,
    jettonWalletCode: Cell,
};

export function storeJettonMinterContent(src: JettonMinterContent) {
    return (builder: Builder) => {
        builder.storeCoins(0);
        builder.storeAddress(src.admin);
        builder.storeRef(src.content);
        builder.storeRef(src.jettonWalletCode);
    }
}

export function loadJettonMinterContent(slice: Slice): JettonMinterContent {
    const totalSupply = slice.loadCoins();
    const adminAddress = slice.loadAddress();
    const jettonContent = slice.loadRef();
    const jettonWalletCode = slice.loadRef();

    return {
        admin: adminAddress,
        content: jettonContent,
        jettonWalletCode,
    }
}

export type JettonChangeAdminMessage = {
    queryId?: bigint,
    newAdmin: Address,
}

export function storeJettonChangeAdminMessage(src: JettonChangeAdminMessage) {
    return (builder: Builder) => {
        const changeAdminOpcode = 3;
        const queryId = src.queryId ?? 0;

        builder.storeUint(changeAdminOpcode, 32);
        builder.storeUint(queryId, 64);
        builder.storeAddress(src.newAdmin);
    }
}

export function loadJettonChangeAdminMessage(slice: Slice): JettonChangeAdminMessage {
    const changeAdminOpcode = 3;
    if (slice.loadUint(32) !== changeAdminOpcode) {
        throw new Error('Wrong opcode');
    }

    const queryId = slice.loadUintBig(64);
    const newAdmin = slice.loadAddress();

    return {
        queryId,
        newAdmin,
    }
}

export type JettonChangeContentMessage = {
    queryId?: bigint,
    newContent: Cell,
}

export function storeJettonChangeContentMessage(src: JettonChangeContentMessage) {
    return (builder: Builder) => {
        const changeContentOpcode = 4;
        const queryId = src.queryId ?? 0;

        builder.storeUint(changeContentOpcode, 32);
        builder.storeUint(queryId, 64);
        builder.storeRef(src.newContent);
    }
}

export class JettonMinter implements Contract {
    static code = Cell.fromBase64(jettonMinterCode.codeBoc);

    constructor(public readonly address: Address, public sender?: Sender, public readonly init?: {
        code: Cell,
        data: Cell
    }, public readonly contentResolver?: ContentResolver) {
    }

    static create(params: {
        admin: Address,
        content: Cell,
        jettonWalletCode?: Cell,
    }, sender?: Sender, contentResolver?: ContentResolver) {
        const jettonWalletCode = params.jettonWalletCode ?? JettonWallet.code;
        const data = beginCell().store(storeJettonMinterContent({
            admin: params.admin,
            content: params.content,
            jettonWalletCode,
        })).endCell();
        const init = {data, code: JettonMinter.code};
        return new JettonMinter(contractAddress(0, init), sender, init, contentResolver);
    }

    static open(address: Address, sender?: Sender, contentResolver?: ContentResolver) {
        return new JettonMinter(address, sender, undefined, contentResolver);
    }

    async sendDeploy(provider: ContractProvider, args?: { value?: bigint, bounce?: boolean }) {
        if (!this.sender) {
            throw new NoSenderError();
        }

        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.05'),
            bounce: args?.bounce ?? true,
        })
    }

    async sendMint(provider: ContractProvider, message: JettonMintMessage, args?: { value?: bigint, bounce?: boolean }) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }

        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.05'),
            bounce: args?.bounce ?? true,
            body: beginCell().store(storeJettonMintMessage(message)).endCell(),
        })
    }

    async sendChangeAdmin(provider: ContractProvider, message: JettonChangeAdminMessage, args?: {
        value?: bigint,
        bounce?: boolean
    }) {
        if (!this.sender) {
            throw new NoSenderError();
        }

        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.05'),
            bounce: args?.bounce ?? true,
            body: beginCell().store(storeJettonChangeAdminMessage(message)).endCell(),
        });
    }

    async sendChangeContent(provider: ContractProvider, message: JettonChangeContentMessage, args?: {
        value?: bigint,
        bounce?: boolean
    }) {
        if (!this.sender) {
            throw new NoSenderError();
        }

        await provider.internal(this.sender, {
            value: args?.value ?? toNano('0.05'),
            bounce: args?.bounce ?? true,
            body: beginCell().store(storeJettonChangeContentMessage(message)).endCell(),
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

    async getWallet(provider: ExtendedContractProvider, owner: Address) {
        const jettonWalletAddress = await this.getWalletAddress(provider, owner);
        return provider.reopen(new JettonWallet(jettonWalletAddress, this.sender));
    }

    async getContent(provider: ContractProvider) {
        if (!this.contentResolver) {
            throw new Error('No content resolver');
        }

        const data = await this.getData(provider);
        return parseJettonContent(await loadFullContent(data.jettonContent, this.contentResolver));
    }
}
