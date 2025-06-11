import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    MessageRelaxed,
    Sender,
    SendMode,
    StateInit,
    storeMessageRelaxed,
    toNano,
} from '@ton/core';

import { NftSaleData } from './data';

export class NftSale implements Contract {
    static code = Cell.fromBase64(
        'te6cckECCwEAArkAART/APSkE/S88sgLAQIBIAMCAH7yMO1E0NMA0x/6QPpA+kD6ANTTADDAAY4d+ABwB8jLABbLH1AEzxZYzxYBzxYB+gLMywDJ7VTgXweCAP/+8vACAUgFBABXoDhZ2omhpgGmP/SB9IH0gfQBqaYAYGGh9IH0AfSB9ABhBCCMkrCgFYACqwECAs0IBgH3ZghA7msoAUmCgUjC+8uHCJND6QPoA+kD6ADBTkqEhoVCHoRagUpBwgBDIywVQA88WAfoCy2rJcfsAJcIAJddJwgKwjhdQRXCAEMjLBVADzxYB+gLLaslx+wAQI5I0NOJacIAQyMsFUAPPFgH6AstqyXH7AHAgghBfzD0UgcAlsjLHxPLPyPPFlADzxbKAIIJycOA+gLKAMlxgBjIywUmzxZw+gLLaszJgwb7AHFVUHAHyMsAFssfUATPFljPFgHPFgH6AszLAMntVAH30A6GmBgLjYSS+CcH0gGHaiaGmAaY/9IH0gfSB9AGppgBgYOCmE44BgAEqYhOmPhW8Q4YBKGATpn8cIxbMbC3MbK2QV44LJOZlvKAVxFWAAyS+G8BJrpOEBFcCBFd0VYACRWdjYKdxjgthOjq+G6hhoaYPqGAD9gHAU4ADAkB6PLRlLOOQjEzOTlTUscFkl8J4FFRxwXy4fSCEAUTjZEWuvLh9QP6QDBGUBA0WXAHyMsAFssfUATPFljPFgHPFgH6AszLAMntVOAwNyjAA+MCKMAAnDY3EDhHZRRDMHDwBeAIwAKYVUQQJBAj8AXgXwqED/LwCgDUODmCEDuaygAYvvLhyVNGxwVRUscFFbHy4cpwIIIQX8w9FCGAEMjLBSjPFiH6Astqyx8Vyz8nzxYnzxYUygAj+gITygDJgwb7AHFQZkUVBHAHyMsAFssfUATPFljPFgHPFgH6AszLAMntVOBqUYM=',
    );

    constructor(
        public readonly address: Address,
        public readonly init?: StateInit,
    ) {}

    static createFromConfig(
        params: {
            createdAt: number;
            marketplace: Address | null;
            nft: Address;
            fullPrice: bigint;
            marketplaceFeeTo: Address | null;
            marketplaceFee: bigint;
            royaltyTo: Address | null;
            royalty: bigint;
            canDeployByExternal: boolean;
        },
        code?: Cell,
        workchain?: number,
    ) {
        const data = beginCell()
            .storeBit(false)
            .storeUint(params.createdAt, 32)
            .storeAddress(params.marketplace)
            .storeAddress(params.nft)
            .storeAddress(null)
            .storeCoins(params.fullPrice)
            .storeRef(
                beginCell()
                    .storeAddress(params.marketplaceFeeTo)
                    .storeCoins(params.marketplaceFee)
                    .storeAddress(params.royaltyTo)
                    .storeCoins(params.royalty),
            )
            .storeBit(params.canDeployByExternal)
            .endCell();
        const init = { data, code: code ?? NftSale.code };
        return new NftSale(contractAddress(workchain ?? 0, init), init);
    }

    static createFromAddress(address: Address) {
        return new NftSale(address);
    }

    async sendDeploy(provider: ContractProvider, sender: Sender, value?: bigint) {
        await provider.internal(sender, {
            value: value ?? toNano('1'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });
    }

    async sendDeployExternal(provider: ContractProvider) {
        await provider.external(new Cell());
    }

    async sendTopup(provider: ContractProvider, sender: Sender, options?: { value?: bigint; queryId?: bigint }) {
        await provider.internal(sender, {
            value: options?.value ?? toNano('0.05'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32)
                .storeUint(options?.queryId ?? 0, 64)
                .endCell(),
        });
    }

    async sendAdminMessage(
        provider: ContractProvider,
        sender: Sender,
        params: {
            message: MessageRelaxed | Cell;
            sendMode: SendMode;
        },
        value?: bigint,
        queryId?: bigint,
    ) {
        const builder = beginCell()
            .storeUint(555, 32)
            .storeUint(queryId ?? 0, 64);
        if (params.message instanceof Cell) {
            builder.storeRef(builder);
        } else {
            builder.storeRef(beginCell().store(storeMessageRelaxed(params.message)));
        }
        await provider.internal(sender, {
            value: value ?? toNano('0.05'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: builder.storeUint(params.sendMode, 8).endCell(),
        });
    }

    async sendCancel(provider: ContractProvider, sender: Sender, options?: { value?: bigint; queryId?: bigint }) {
        const { isComplete } = await this.getData(provider);

        if (isComplete) {
            throw new Error('Sale is complete');
        }

        await provider.internal(sender, {
            value: options?.value ?? toNano('1'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(3, 32)
                .storeUint(options?.queryId ?? 0, 64)
                .endCell(),
        });
    }

    async sendBuy(provider: ContractProvider, sender: Sender, options?: { value?: bigint; queryId?: bigint }) {
        const { isComplete, nftOwner, fullPrice } = await this.getData(provider);

        if (!isComplete) {
            throw new Error('Sale is not complete');
        }

        if (nftOwner === null) {
            throw new Error('NFT owner is not set');
        }

        await provider.internal(sender, {
            value: options?.value ?? fullPrice + toNano(1),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(2, 32)
                .storeUint(options?.queryId ?? 0, 64)
                .endCell(),
        });
    }

    async getData(provider: ContractProvider): Promise<NftSaleData> {
        const { stack } = await provider.get('get_sale_data', []);
        return {
            type: stack.readNumber(),
            isComplete: stack.readBoolean(),
            createdAt: stack.readNumber(),
            marketplace: stack.readAddress(),
            nft: stack.readAddress(),
            nftOwner: stack.readAddressOpt(),
            fullPrice: stack.readBigNumber(),
            marketplaceFeeTo: stack.readAddress(),
            marketplaceFee: stack.readBigNumber(),
            royaltyTo: stack.readAddressOpt(),
            royalty: stack.readBigNumber(),
        };
    }
}
