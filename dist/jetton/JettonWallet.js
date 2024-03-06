"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JettonWallet = void 0;
const core_1 = require("@ton/core");
const error_1 = require("../error");
class JettonWallet {
    constructor(address, sender) {
        this.address = address;
        this.sender = sender;
    }
    async getData(provider) {
        const { stack } = await provider.get('get_wallet_data', []);
        return {
            balance: stack.readBigNumber(),
            owner: stack.readAddress(),
            jetton: stack.readAddress(),
            code: stack.readCell(),
        };
    }
    async sendTransfer(provider, request) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        const response = request.responseDestination ?? this.sender.address;
        await provider.internal(this.sender, {
            value: request.value ?? (0, core_1.toNano)('0.05'),
            bounce: true,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
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
    async sendBurn(provider, request) {
        if (this.sender === undefined) {
            throw new error_1.NoSenderError();
        }
        const response = request.responseDestination ?? this.sender.address;
        await provider.internal(this.sender, {
            value: request.value ?? (0, core_1.toNano)('0.02'),
            bounce: true,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(0x595f07bc, 32)
                .storeUint(request.queryId ?? 0, 64)
                .storeCoins(request.amount)
                .storeAddress(response)
                .storeMaybeRef(request.customPayload)
                .endCell(),
        });
    }
    static parseTransferBody(body) {
        if (body instanceof core_1.Cell) {
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
    static parseTransfer(tx) {
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
exports.JettonWallet = JettonWallet;
JettonWallet.code = core_1.Cell.fromBase64('te6ccgECEgEAAzQAART/APSkE/S88sgLAQIBYgIDAgLMBAUAG6D2BdqJofQB9IH0gahhAgHUBgcCAUgICQDDCDHAJJfBOAB0NMDAXGwlRNfA/AL4PpA+kAx+gAxcdch+gAx+gAwc6m0AALTH4IQD4p+pVIgupUxNFnwCOCCEBeNRRlSILqWMUREA/AJ4DWCEFlfB7y6k1nwCuBfBIQP8vCAAET6RDBwuvLhTYAIBIAoLAgEgEBEB8QD0z/6APpAIfAB7UTQ+gD6QPpA1DBRNqFSKscF8uLBKML/8uLCVDRCcFQgE1QUA8hQBPoCWM8WAc8WzMkiyMsBEvQA9ADLAMkg+QBwdMjLAsoHy//J0AT6QPQEMfoAINdJwgDy4sR3gBjIywVQCM8WcPoCF8trE8yAMA/c7UTQ+gD6QPpA1DAI0z/6AFFRoAX6QPpAU1vHBVRzbXBUIBNUFAPIUAT6AljPFgHPFszJIsjLARL0APQAywDJ+QBwdMjLAsoHy//J0FANxwUcsfLiwwr6AFGooYIImJaAggiYloAStgihggjk4cCgGKEn4w8l1wsBwwAjgDQ4PAK6CEBeNRRnIyx8Zyz9QB/oCIs8WUAbPFiX6AlADzxbJUAXMI5FykXHiUAioE6CCCOThwKoAggiYloCgoBS88uLFBMmAQPsAECPIUAT6AljPFgHPFszJ7VQAcFJ5oBihghBzYtCcyMsfUjDLP1j6AlAHzxZQB88WyXGAEMjLBSTPFlAG+gIVy2oUzMlx+wAQJBAjAA4QSRA4N18EAHbCALCOIYIQ1TJ223CAEMjLBVAIzxZQBPoCFstqEssfEss/yXL7AJM1bCHiA8hQBPoCWM8WAc8WzMntVADbO1E0PoA+kD6QNQwB9M/+gD6QDBRUaFSSccF8uLBJ8L/8uLCggjk4cCqABagFrzy4sOCEHvdl97Iyx8Vyz9QA/oCIs8WAc8WyXGAGMjLBSTPFnD6AstqzMmAQPsAQBPIUAT6AljPFgHPFszJ7VSAAgyAINch7UTQ+gD6QPpA1DAE0x+CEBeNRRlSILqCEHvdl94TuhKx8uLF0z8x+gAwE6BQI8hQBPoCWM8WAc8WzMntVIA==');
