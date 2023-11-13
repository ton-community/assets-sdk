import { Address, Cell, beginCell, toNano, Sender, ContractProvider, SendMode, Slice, Transaction, contractAddress, Contract } from "@ton/core";
import { ExtendedContractProvider } from "../ExtendedContractProvider";
import { NoSenderError } from "../error";
import { JettonTransferRequest, JettonBurnRequest, JettonTransferBody, JettonTransfer, JettonMinterData, JettonMintRequest, JettonWalletData } from "./data";

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

export class JettonWallet implements Contract {
    constructor(public readonly address: Address, public sender?: Sender) {}

    async getData(provider: ContractProvider): Promise<JettonWalletData> {
        const { stack } = await provider.get('get_wallet_data', []);
        return {
            balance: stack.readBigNumber(),
            owner: stack.readAddress(),
            jetton: stack.readAddress(),
            code: stack.readCell(),
        };
    }

    async sendTransfer(provider: ContractProvider, request: JettonTransferRequest) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        const response = request.responseDestination ?? this.sender.address;
        await provider.internal(this.sender, {
            value: request.value ?? toNano('0.02'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x0f8a7ea5, 32)
                .storeUint(request.queryId ?? 0, 64)
                .storeCoins(request.amount)
                .storeAddress(request.to)
                .storeAddress(response)
                .storeMaybeRef(request.customPayload)
                .storeCoins(request.forwardAmount ?? 0)
                .storeMaybeRef(request.forwardPayload)
                .endCell(),
        });
    }

    async sendBurn(provider: ContractProvider, request: JettonBurnRequest) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        const response = request.responseDestination ?? this.sender.address;
        await provider.internal(this.sender, {
            value: request.value ?? toNano('0.02'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x595f07bc, 32)
                .storeUint(request.queryId ?? 0, 64)
                .storeCoins(request.amount)
                .storeAddress(response)
                .storeMaybeRef(request.customPayload)
                .endCell(),
        });
    }

    static parseTransferBody(body: Cell | Slice): JettonTransferBody {
        if (body instanceof Cell) {
            body = body.beginParse();
        }
        if (body.loadUint(32) !== 0x0f8a7ea5) {
            throw new Error('Wrong opcode');
        }
        const queryId = body.loadUintBig(64);
        const amount = body.loadCoins();
        const destination = body.loadAddress();
        const responseDestination = body.loadMaybeAddress();
        const customPayload = body.loadMaybeRef();
        const forwardAmount = body.loadCoins();
        const forwardPayloadIsRight = body.loadBoolean();
        const forwardPayload = forwardPayloadIsRight ? body.loadRef() : body.asCell();
        return {
            queryId,
            amount,
            destination,
            responseDestination,
            customPayload,
            forwardAmount,
            forwardPayload,
        };
    }

    static parseTransfer(tx: Transaction): JettonTransfer {
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

export class Jetton implements Contract {
    constructor(public readonly address: Address, public sender?: Sender, public readonly init?: { code: Cell, data: Cell }) {}

    static create(params: {
        admin: Address,
        content: Cell,
    }, sender?: Sender) {
        const data = beginCell()
            .storeCoins(0)
            .storeAddress(params.admin)
            .storeRef(params.content)
            .storeRef(walletCode)
            .endCell();
        const init = { data, code: minterCode };
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

const minterCode = Cell.fromBase64('te6ccgECDgEAAqMAART/APSkE/S88sgLAQIBYgIDAgLMBAUCA3pgDA0B9dkGOASS+B8ADoaYGAuNhJL4HwfSB9IBj9ABi465D9ABj9ABg51NoAAWmP6Z/2omh9AH0gamoYQAqpOF1HGZqamxsommOC+XAkgX0gfQBqGBBoQDBrkP0AGBKIGigheASKUCgZ5CgCfQEsZ4tmZmT2qnBBCD3uy+8pOF1AYAk7PwUIgG4KhAJqgoB5CgCfQEsZ4sA54tmZJFkZYCJegB6AGWAZJB8gDg6ZGWBZQPl/+ToO8AMZGWCrGeLKAJ9AQnltYlmZmS4/YBBPSO4DY3NwH6APpA+ChUEgZwVCATVBQDyFAE+gJYzxYBzxbMySLIywES9AD0AMsAyfkAcHTIywLKB8v/ydBQBscF8uBKoQNFRchQBPoCWM8WzMzJ7VQB+kAwINcLAcMAkVvjDeCCECx2uXNScLrjAjU3NyPAA+MCNQLABAcICQoAPoIQ1TJ223CAEMjLBVADzxYi+gISy2rLH8s/yYBC+wAB/jZfA4IImJaAFaAVvPLgSwL6QNMAMJXIIc8WyZFt4oIQ0XNUAHCAGMjLBVAFzxYk+gIUy2oTyx8Uyz8j+kQwcLqOM/goRANwVCATVBQDyFAE+gJYzxYBzxbMySLIywES9AD0AMsAyfkAcHTIywLKB8v/ydDPFpZsInABywHi9AALADQzUDXHBfLgSQP6QDBZyFAE+gJYzxbMzMntVABCjhhRJMcF8uBJ1DBDAMhQBPoCWM8WzMzJ7VTgXwWED/LwAArJgED7AAB9rbz2omh9AH0gamoYNhj8FAC4KhAJqgoB5CgCfQEsZ4sA54tmZJFkZYCJegB6AGWAZPyAODpkZYFlA+X/5OhAAB+vFvaiaH0AfSBqahg/qpBA');
const walletCode = Cell.fromBase64('te6ccgECEgEAAzQAART/APSkE/S88sgLAQIBYgIDAgLMBAUAG6D2BdqJofQB9IH0gahhAgHUBgcCAUgICQDDCDHAJJfBOAB0NMDAXGwlRNfA/AL4PpA+kAx+gAxcdch+gAx+gAwc6m0AALTH4IQD4p+pVIgupUxNFnwCOCCEBeNRRlSILqWMUREA/AJ4DWCEFlfB7y6k1nwCuBfBIQP8vCAAET6RDBwuvLhTYAIBIAoLAgEgEBEB8QD0z/6APpAIfAB7UTQ+gD6QPpA1DBRNqFSKscF8uLBKML/8uLCVDRCcFQgE1QUA8hQBPoCWM8WAc8WzMkiyMsBEvQA9ADLAMkg+QBwdMjLAsoHy//J0AT6QPQEMfoAINdJwgDy4sR3gBjIywVQCM8WcPoCF8trE8yAMA/c7UTQ+gD6QPpA1DAI0z/6AFFRoAX6QPpAU1vHBVRzbXBUIBNUFAPIUAT6AljPFgHPFszJIsjLARL0APQAywDJ+QBwdMjLAsoHy//J0FANxwUcsfLiwwr6AFGooYIImJaAggiYloAStgihggjk4cCgGKEn4w8l1wsBwwAjgDQ4PAK6CEBeNRRnIyx8Zyz9QB/oCIs8WUAbPFiX6AlADzxbJUAXMI5FykXHiUAioE6CCCOThwKoAggiYloCgoBS88uLFBMmAQPsAECPIUAT6AljPFgHPFszJ7VQAcFJ5oBihghBzYtCcyMsfUjDLP1j6AlAHzxZQB88WyXGAEMjLBSTPFlAG+gIVy2oUzMlx+wAQJBAjAA4QSRA4N18EAHbCALCOIYIQ1TJ223CAEMjLBVAIzxZQBPoCFstqEssfEss/yXL7AJM1bCHiA8hQBPoCWM8WAc8WzMntVADbO1E0PoA+kD6QNQwB9M/+gD6QDBRUaFSSccF8uLBJ8L/8uLCggjk4cCqABagFrzy4sOCEHvdl97Iyx8Vyz9QA/oCIs8WAc8WyXGAGMjLBSTPFnD6AstqzMmAQPsAQBPIUAT6AljPFgHPFszJ7VSAAgyAINch7UTQ+gD6QPpA1DAE0x+CEBeNRRlSILqCEHvdl94TuhKx8uLF0z8x+gAwE6BQI8hQBPoCWM8WAc8WzMntVIA==');
