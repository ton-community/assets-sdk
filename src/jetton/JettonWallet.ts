import {
    Address,
    beginCell,
    Cell,
    Contract, contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    StateInit,
    toNano,
} from "@ton/core";
import {jettonWalletCode} from "./contracts/build/jetton-wallet";
import {
    JettonBurnMessage,
    JettonTransferMessage,
    JettonWalletData,
    storeJettonBurnMessage,
    storeJettonTransferMessage
} from "./JettonWallet.tlb";
import {parseExcessReturnOptions, parseNotifyOptions, SendTransferOptions} from "../common/types";

export type JettonWalletConfig = {
    balance?: bigint;
    owner: Address;
    jettonMaster: Address;
    jettonWalletCode?: Cell;
}

export function jettonWalletConfigToCell(config: Required<JettonWalletConfig>): Cell {
    return beginCell()
        .storeCoins(config.balance)
        .storeAddress(config.owner)
        .storeAddress(config.jettonMaster)
        .storeRef(config.jettonWalletCode)
        .endCell();
}

export class JettonWallet implements Contract {
    static code = Cell.fromBase64(jettonWalletCode.codeBoc);

    constructor(public readonly address: Address, public readonly init?: StateInit) {
    }

    static createFromConfig(config: JettonWalletConfig, code?: Cell, workchain?: number) {
        const data = jettonWalletConfigToCell({
            balance: config.balance ?? 0n,
            owner: config.owner,
            jettonMaster: config.jettonMaster,
            jettonWalletCode: code ?? JettonWallet.code,
        });
        const init = {data, code: code ?? JettonWallet.code};
        return new JettonWallet(contractAddress(workchain ?? 0, init), init);
    }

    static createFromAddress(address: Address): JettonWallet {
        return new JettonWallet(address);
    }

    async sendDeploy(provider: ContractProvider, sender: Sender, value?: bigint) {
        await provider.internal(sender, {
            value: value ?? toNano('0.05'),
            bounce: true,
        });
    }

    async send(provider: ContractProvider, sender: Sender, recipient: Address, amount: bigint, options?: SendTransferOptions, value?: bigint, queryId?: bigint) {
        const notification = parseNotifyOptions(options?.notify);
        const excessReturn = parseExcessReturnOptions(options?.returnExcess, sender);

        await provider.internal(sender, {
            value: value ?? toNano('0.05'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeJettonTransferMessage({
                queryId: queryId ?? 0n,
                amount: amount,
                to: recipient,
                responseDestination: excessReturn?.address ?? null,
                customPayload: null,
                forwardAmount: notification?.amount ?? 0n,
                forwardPayload: notification?.payload ?? null,
            })).endCell(),
        });
    }

    async sendBurn(provider: ContractProvider, sender: Sender, amount: bigint, options?: Pick<SendTransferOptions, 'returnExcess'>, value?: bigint, queryId?: bigint) {
        const excessReturn = parseExcessReturnOptions(options?.returnExcess, sender);

        await provider.internal(sender, {
            value: value ?? toNano('0.02'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeJettonBurnMessage({
                queryId: queryId ?? 0n,
                amount: amount,
                responseDestination: excessReturn?.address ?? null,
                customPayload: null,
            })).endCell(),
        });
    }

    async getData(provider: ContractProvider): Promise<JettonWalletData> {
        const {stack} = await provider.get('get_wallet_data', []);
        return {
            balance: stack.readBigNumber(),
            owner: stack.readAddress(),
            jetton: stack.readAddress(),
            code: stack.readCell(),
        };
    }
}
