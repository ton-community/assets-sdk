import { Contract, Address, Sender, ContractProvider, toNano, SendMode, beginCell, Cell, Slice, Transaction } from "@ton/core";
import { NoSenderError } from "../error";
import { NftTransferRequest, NftItemData, NftTransferBody, NftTransfer } from "./data";
import { ContentResolver, loadFullContent } from "../content";
import { ExtendedContractProvider } from "../ExtendedContractProvider";
import { NftCollection } from "./NftCollection";
import { parseNftContent } from "./content";

export class NftItem implements Contract {
    static nftCode = Cell.fromBase64('te6cckECDgEAAdwAART/APSkE/S88sgLAQIBYgIDAgLOBAUACaEfn+AFAgEgBgcCASAMDQLPDIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAwc6m0APACBLOOFDBsIjRSMscF8uGVAfpA1DAQI/AD4AbTH9M/ghBfzD0UUjC64wIwNDQ1NYIQL8smohK64wJfBIQP8vCAICQARPpEMHC68uFNgAqwyEDdeMkATUTXHBfLhkfpAIfAB+kDSADH6ACDXScIA8uLEggr68IAboSGUUxWgod4i1wsBwwAgkgahkTbiIML/8uGSIZQQKjdb4w0CkzAyNOMNVQLwAwoLAHJwghCLdxc1BcjL/1AEzxYQJIBAcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wAAfIIQBRONkchQCc8WUAvPFnEkSRRURqBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7ABBHAGom8AGCENUydtsQN0QAbXFwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AAA7O1E0NM/+kAg10nCAJp/AfpA1DAQJBAj4DBwWW1tgAB0A8jLP1jPFgHPFszJ7VSAhpPNg');
    static sbtCode = Cell.fromBase64('te6cckECEwEAAzsAART/APSkE/S88sgLAQIBYgIDAgLOBAUCASAPEAS9RsIiDHAJFb4AHQ0wP6QDDwAvhCs44cMfhDAccF8uGV+kAB+GTUAfhm+kAw+GVw+GfwA+AC0x8CcbDjAgHTP4IQ0MO/6lIwuuMCghAE3tFIUjC64wIwghAvyyaiUiC6gGBwgJAgEgDQ4AlDAx0x+CEAUkx64Suo450z8wgBD4RHCCEMGOhtJVA22AQAPIyx8Syz8hbrOTAc8XkTHiyXEFyMsFUATPFlj6AhPLaszJAfsAkTDiAMJsEvpA1NMAMPhH+EHIy/9QBs8W+ETPFhLMFMs/UjDLAAPDAJb4RlADzALegBB4sXCCEA3WB+NANRSAQAPIyx8Syz8hbrOTAc8XkTHiyXEFyMsFUATPFlj6AhPLaszJAfsAAMYy+ERQA8cF8uGR+kDU0wAw+Ef4QcjL//hEzxYTzBLLP1IQywABwwCU+EYBzN6AEHixcIIQBSTHrkBVA4BAA8jLHxLLPyFus5MBzxeRMeLJcQXIywVQBM8WWPoCE8tqzMkB+wAD+o5AMfhByMv/+EPPFoAQcIIQi3cXNUAVUEQDgEADyMsfEss/IW6zkwHPF5Ex4slxBcjLBVAEzxZY+gITy2rMyQH7AOCCEB8EU3pSILrjAoIQb4n141Iguo4WW/hFAccF8uGR+EfAAPLhk/gj+GfwA+CCENE207NSILrjAjAxCgsMAJIx+EQixwXy4ZGAEHCCENUydtsQJFUCbYMGA8jLHxLLPyFus5MBzxeRMeLJcQXIywVQBM8WWPoCE8tqzMkB+wCLAvhkiwL4ZfADAI4x+EQixwXy4ZGCCvrwgHD7AoAQcIIQ1TJ22xAkVQJtgwYDyMsfEss/IW6zkwHPF5Ex4slxBcjLBVAEzxZY+gITy2rMyQH7AAAgghBfzD0UupPywZ3ehA/y8ABhO1E0NM/Afhh+kAB+GNw+GIg10nCAI4Wf/hi+kAB+GTUAfhm+kAB+GXTPzD4Z5Ew4oAA3PhH+Eb4QcjLP/hDzxb4RM8WzPhFzxbLP8ntVIAIBWBESAB28fn+AF8IXwg/CH8InwjQADbVjHgBfCLAADbewfgBfCPAtMqVw');

    constructor(public readonly address: Address, public sender?: Sender, public contentResolver?: ContentResolver) {}

    async sendTransfer(provider: ContractProvider, request: NftTransferRequest) {
        if (this.sender === undefined) {
            throw new NoSenderError();
        }
        const response = request.responseDestination ?? this.sender.address;
        await provider.internal(this.sender, {
            value: request.value ?? toNano('0.03'),
            bounce: true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x5fcc3d14, 32)
                .storeUint(request.queryId ?? 0, 64)
                .storeAddress(request.to)
                .storeAddress(response)
                .storeMaybeRef(request.customPayload)
                .storeCoins(request.forwardAmount ?? 0)
                .storeMaybeRef(request.forwardPayload)
                .endCell(),
        });
    }

    async getData(provider: ContractProvider): Promise<NftItemData> {
        const { stack } = await provider.get('get_nft_data', []);
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
        const { collection, individualContent, index } = await this.getData(provider);
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

    static parseTransferBody(body: Cell | Slice): NftTransferBody {
        if (body instanceof Cell) {
            body = body.beginParse();
        }
        if (body.loadUint(32) !== 0x0f8a7ea5) {
            throw new Error('Wrong opcode');
        }
        const queryId = body.loadUintBig(64);
        const newOwner = body.loadAddress();
        const responseDestination = body.loadMaybeAddress();
        const customPayload = body.loadMaybeRef();
        const forwardAmount = body.loadCoins();
        const forwardPayloadIsRight = body.loadBoolean();
        const forwardPayload = forwardPayloadIsRight ? body.loadRef() : body.asCell();
        return {
            queryId,
            newOwner,
            responseDestination,
            customPayload,
            forwardAmount,
            forwardPayload,
        };
    }

    static parseTransfer(tx: Transaction): NftTransfer {
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
