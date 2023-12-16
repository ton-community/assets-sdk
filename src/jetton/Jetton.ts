import { beginCell, toNano, Contract, Address, Sender, Cell, contractAddress, ContractProvider, SendMode } from "@ton/core";
import { JettonWallet } from "./JettonWallet";
import { ExtendedContractProvider } from "../ExtendedContractProvider";
import { NoSenderError } from "../error";
import { JettonMintRequest, JettonMinterData } from "./data";

function mintMessage(params: JettonMintRequest) {
    return beginCell()
        .storeUint(21, 32)
        .storeUint(params.queryId ?? 0, 64)
        .storeAddress(params.to)
        .storeCoins(params.walletForwardValue ?? toNano('0.02'))
        .storeRef(beginCell()
            .storeUint(0x178d4519, 32)
            .storeUint(params.queryId ?? 0, 64)
            .storeCoins(params.amount)
            .storeAddress(null)
            .storeAddress(params.responseDestination ?? params.to)
            .storeCoins(params.forwardAmount ?? 0)
            .storeMaybeRef(params.forwardPayload))
        .endCell();
}

export class Jetton implements Contract {
    static code = Cell.fromBase64('te6ccgECDgEAAqMAART/APSkE/S88sgLAQIBYgIDAgLMBAUCA3pgDA0B9dkGOASS+B8ADoaYGAuNhJL4HwfSB9IBj9ABi465D9ABj9ABg51NoAAWmP6Z/2omh9AH0gamoYQAqpOF1HGZqamxsommOC+XAkgX0gfQBqGBBoQDBrkP0AGBKIGigheASKUCgZ5CgCfQEsZ4tmZmT2qnBBCD3uy+8pOF1AYAk7PwUIgG4KhAJqgoB5CgCfQEsZ4sA54tmZJFkZYCJegB6AGWAZJB8gDg6ZGWBZQPl/+ToO8AMZGWCrGeLKAJ9AQnltYlmZmS4/YBBPSO4DY3NwH6APpA+ChUEgZwVCATVBQDyFAE+gJYzxYBzxbMySLIywES9AD0AMsAyfkAcHTIywLKB8v/ydBQBscF8uBKoQNFRchQBPoCWM8WzMzJ7VQB+kAwINcLAcMAkVvjDeCCECx2uXNScLrjAjU3NyPAA+MCNQLABAcICQoAPoIQ1TJ223CAEMjLBVADzxYi+gISy2rLH8s/yYBC+wAB/jZfA4IImJaAFaAVvPLgSwL6QNMAMJXIIc8WyZFt4oIQ0XNUAHCAGMjLBVAFzxYk+gIUy2oTyx8Uyz8j+kQwcLqOM/goRANwVCATVBQDyFAE+gJYzxYBzxbMySLIywES9AD0AMsAyfkAcHTIywLKB8v/ydDPFpZsInABywHi9AALADQzUDXHBfLgSQP6QDBZyFAE+gJYzxbMzMntVABCjhhRJMcF8uBJ1DBDAMhQBPoCWM8WzMzJ7VTgXwWED/LwAArJgED7AAB9rbz2omh9AH0gamoYNhj8FAC4KhAJqgoB5CgCfQEsZ4sA54tmZJFkZYCJegB6AGWAZPyAODpkZYFlA+X/5OhAAB+vFvaiaH0AfSBqahg/qpBA');

    constructor(public readonly address: Address, public sender?: Sender, public readonly init?: { code: Cell, data: Cell }) {}

    static create(params: {
        admin: Address,
        content: Cell,
    }, sender?: Sender) {
        const data = beginCell()
            .storeCoins(0)
            .storeAddress(params.admin)
            .storeRef(params.content)
            .storeRef(JettonWallet.code)
            .endCell();
        const init = { data, code: Jetton.code };
        return new Jetton(contractAddress(0, init), sender, init);
    }

    static open(address: Address, sender?: Sender) {
        return new Jetton(address, sender);
    }

    async getWalletAddress(provider: ContractProvider, owner: Address) {
        return (await provider.get('get_wallet_address', [{ type: 'slice', cell: beginCell().storeAddress(owner).endCell() }])).stack.readAddress();
    }

    async getWallet(provider: ExtendedContractProvider, owner: Address) {
        return provider.reopen(new JettonWallet(await this.getWalletAddress(provider, owner), this.sender));
    }

    async getData(provider: ContractProvider): Promise<JettonMinterData> {
        const res = (await provider.get('get_jetton_data', [])).stack;
        return {
            totalSupply: res.readBigNumber(),
            mintable: res.readBigNumber() !== 0n,
            adminAddress: res.readAddressOpt(),
            jettonContent: res.readCell(),
            jettonWalletCode: res.readCell(),
        };
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

    async sendMint(provider: ContractProvider, request: JettonMintRequest) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        await provider.internal(this.sender, {
            value: request.requestValue ?? toNano('0.03'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            bounce: true,
            body: mintMessage(request),
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
                .endCell(),
        })
    }
}
