import {Address, Builder, Slice} from "@ton/core";
import {NFT_REPORT_STATIC_DATA_OPCODE} from "../opcodes";

export type NftReportStaticDataMessage = {
    queryId: bigint;
    index: bigint;
    collection: Address;
};

export function storeNftReportStaticDataMessage(message: NftReportStaticDataMessage): (builder: Builder) => void {
    return (builder) => {
        const {queryId, index, collection} = message;
        builder.storeUint(NFT_REPORT_STATIC_DATA_OPCODE, 32)
            .storeUint(queryId, 64)
            .storeUint(index, 256)
            .storeAddress(collection);
    };
}

export function loadNftReportStaticDataMessage(slice: Slice): NftReportStaticDataMessage {
    if (slice.loadUint(32) !== NFT_REPORT_STATIC_DATA_OPCODE) {
        throw new Error('Wrong opcode');
    }
    const queryId = slice.loadUintBig(64);
    const index = slice.loadUintBig(256);
    const collection = slice.loadAddress();
    return {
        queryId,
        index,
        collection,
    };
}
