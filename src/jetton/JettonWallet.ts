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
    toNano,
} from '@ton/core';

import { jettonWalletCode } from './contracts/build/jetton-wallet';
import { parseExcessReturnOptions, parseNotifyOptions, SendTransferOptions } from '../common/types';
import { PartialBy } from '../utils';
import { storeJettonTransferMessage } from './types/JettonTransferMessage';
import { storeJettonBurnMessage } from './types/JettonBurnMessage';
import { JettonWalletAction, parseJettonWalletTransaction } from './types/JettonWalletAction';
import { JettonWalletData } from './types/JettonWalletData';

export function jettonWalletConfigToCell(config: JettonWalletData): Cell {
    return beginCell()
        .storeCoins(config.balance)
        .storeAddress(config.owner)
        .storeAddress(config.jettonMaster)
        .storeRef(config.jettonWalletCode)
        .endCell();
}

export type JettonWalletConfig = Omit<PartialBy<JettonWalletData, 'jettonWalletCode'>, 'balance'>;

export class JettonWallet implements Contract {
    static code = Cell.fromBase64(jettonWalletCode.codeBoc);

    constructor(
        public readonly address: Address,
        public readonly init?: StateInit,
    ) {}

    static createFromConfig(config: JettonWalletConfig, code?: Cell, workchain?: number) {
        const data = jettonWalletConfigToCell({
            balance: 0n,
            owner: config.owner,
            jettonMaster: config.jettonMaster,
            jettonWalletCode: code ?? JettonWallet.code,
        });
        const init = { data, code: code ?? JettonWallet.code };
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

    async send(
        provider: ContractProvider,
        sender: Sender,
        recipient: Address,
        amount: bigint,
        options?: SendTransferOptions & {
            customPayload?: Cell;
            value?: bigint;
            queryId?: bigint;
        },
    ) {
        const notification = parseNotifyOptions(options?.notify);
        const excessReturn = parseExcessReturnOptions(options?.returnExcess, sender);

        await provider.internal(sender, {
            value: (options?.value ?? toNano('0.05')) + (notification?.amount ?? 0n),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .store(
                    storeJettonTransferMessage({
                        queryId: options?.queryId ?? 0n,
                        amount: amount,
                        destination: recipient,
                        responseDestination: excessReturn?.address ?? null,
                        customPayload: options?.customPayload ?? null,
                        forwardAmount: notification?.amount ?? 0n,
                        forwardPayload: notification?.payload ?? null,
                    }),
                )
                .endCell(),
        });
    }

    async sendBurn(
        provider: ContractProvider,
        sender: Sender,
        amount: bigint,
        options?: Pick<SendTransferOptions, 'returnExcess'> & {
            customPayload?: Cell;
            value?: bigint;
            queryId?: bigint;
        },
    ) {
        const excessReturn = parseExcessReturnOptions(options?.returnExcess, sender);

        await provider.internal(sender, {
            value: options?.value ?? toNano('0.05'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .store(
                    storeJettonBurnMessage({
                        queryId: options?.queryId ?? 0n,
                        amount: amount,
                        responseDestination: excessReturn?.address ?? null,
                        customPayload: options?.customPayload ?? null,
                    }),
                )
                .endCell(),
        });
    }

    async getData(provider: ContractProvider): Promise<JettonWalletData> {
        const { stack } = await provider.get('get_wallet_data', []);
        return {
            balance: stack.readBigNumber(),
            owner: stack.readAddress(),
            jettonMaster: stack.readAddress(),
            jettonWalletCode: stack.readCell(),
        };
    }

    async getActions(
        provider: ContractProvider,
        options?:
            | { lt?: never; hash?: never; limit?: number }
            | {
                  lt: bigint;
                  hash: Buffer;
                  limit?: number;
              },
    ): Promise<JettonWalletAction[]> {
        let { lt, hash, limit } = options ?? {};
        if (!lt || !hash) {
            const state = await provider.getState();
            if (!state.last) {
                return [];
            }

            lt = state.last.lt;
            hash = state.last.hash;
        }

        const transactions = await provider.getTransactions(this.address, lt, hash, limit);

        return transactions.map((tx) => parseJettonWalletTransaction(tx));
    }
}
