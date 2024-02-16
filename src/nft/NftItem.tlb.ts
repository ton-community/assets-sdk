import {Address, Builder, Cell, Slice} from "@ton/core";
import {UnknownMessage} from "../common/types";

export const OPCODE_TRANSFER = 0x5fcc3d14;
export const OPCODE_OWNER_ASSIGNED = 0x05138d91;
export const OPCODE_GET_STATIC_DATA = 0x2fcb26a2;
export const OPCODE_REPORT_STATIC_DATA = 0x8b771735;

export type NftTransferMessage = {
    queryId?: bigint | null;
    newOwner: Address;
    responseDestination?: Address | null;
    customPayload?: Cell | null;
    forwardAmount?: bigint | null;
    forwardPayload?: Cell | null;
};

export function storeNftTransferMessage(message: NftTransferMessage): (builder: Builder) => void {
    return (builder) => {
        const {queryId, newOwner, responseDestination, customPayload, forwardAmount, forwardPayload} = message;
        builder.storeUint(OPCODE_TRANSFER, 32)
            .storeUint(queryId ?? 0, 64)
            .storeAddress(newOwner)
            .storeAddress(responseDestination)
            .storeMaybeRef(customPayload)
            .storeCoins(forwardAmount ?? 0)
            .storeMaybeRef(forwardPayload);
    };
}

export function loadNftTransferMessage(slice: Slice): NftTransferMessage {
    if (slice.loadUint(32) !== OPCODE_TRANSFER) {
        throw new Error('Wrong opcode');
    }
    const queryId = slice.loadUintBig(64);
    const newOwner = slice.loadAddress();
    const responseDestination = slice.loadMaybeAddress();
    const customPayload = slice.loadMaybeRef();
    const forwardAmount = slice.loadCoins();
    const forwardPayload = slice.loadMaybeRef();
    return {
        queryId,
        newOwner,
        responseDestination,
        customPayload,
        forwardAmount,
        forwardPayload,
    };
}

export type NftGetStaticDataMessage = {
    queryId?: bigint | null;
};

export function storeNftGetStaticDataMessage(message: NftGetStaticDataMessage): (builder: Builder) => void {
    return (builder) => {
        const {queryId} = message;
        builder.storeUint(OPCODE_GET_STATIC_DATA, 32)
            .storeUint(queryId ?? 0, 64);
    };
}

export function loadNftGetStaticDataMessage(slice: Slice): NftGetStaticDataMessage {
    if (slice.loadUint(32) !== OPCODE_GET_STATIC_DATA) {
        throw new Error('Wrong opcode');
    }
    const queryId = slice.loadUintBig(64);
    return {
        queryId,
    };
}

export type NftReportStaticDataMessage = {
    queryId?: bigint | null;
    index: bigint;
    collection: Address;
};

export function storeNftReportStaticDataMessage(message: NftReportStaticDataMessage): (builder: Builder) => void {
    return (builder) => {
        const {queryId, index, collection} = message;
        builder.storeUint(OPCODE_REPORT_STATIC_DATA, 32)
            .storeUint(queryId ?? 0, 64)
            .storeUint(index, 256)
            .storeAddress(collection);
    };
}

export function loadNftReportStaticDataMessage(slice: Slice): NftReportStaticDataMessage {
    if (slice.loadUint(32) !== OPCODE_REPORT_STATIC_DATA) {
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

export type NftDeployMessage = {
    owner: Address;
    content: Cell;
};

export function storeNftDeployMessage(message: NftDeployMessage): (builder: Builder) => void {
    return (builder) => {
        const {owner, content} = message;
        builder.storeAddress(owner)
            .storeRef(content);
    };
}

export function loadNftDeployMessage(slice: Slice): NftDeployMessage {
    const owner = slice.loadAddress();
    const content = slice.loadRef();
    return {
        owner,
        content,
    };
}

export type NftOwnerAssignedMessage = {
    queryId?: bigint | null;
    previousOwner: Address;
    payload: Cell;
};

export function storeNftOwnerAssignedMessage(message: NftOwnerAssignedMessage): (builder: Builder) => void {
    return (builder) => {
        const {queryId, previousOwner, payload} = message;
        builder.storeUint(OPCODE_OWNER_ASSIGNED, 32)
            .storeUint(queryId ?? 0, 64)
            .storeAddress(previousOwner)
            .storeRef(payload);
    };
}

export function loadNftOwnerAssignedMessage(slice: Slice): NftOwnerAssignedMessage {
    if (slice.loadUint(32) !== OPCODE_OWNER_ASSIGNED) {
        throw new Error('Wrong opcode');
    }
    const queryId = slice.loadUintBig(64);
    const previousOwner = slice.loadAddress();
    const payload = slice.loadRef();
    return {
        queryId,
        previousOwner,
        payload,
    };
}

type SetKind<T, K> = T & { kind: K };

export type NftMessage =
    | SetKind<NftTransferMessage, 'transfer'>
    | SetKind<NftDeployMessage, 'deploy'>
    | SetKind<NftGetStaticDataMessage, 'getStaticData'>
    | SetKind<NftReportStaticDataMessage, 'reportStaticData'>
    | SetKind<NftOwnerAssignedMessage, 'ownerAssigned'>
    | SetKind<UnknownMessage, 'unknown'>;

export function loadNftMessage(slice: Slice): NftMessage {
    try {
        const opcode = slice.preloadUint(32);
        switch (opcode) {
            case OPCODE_TRANSFER:
                return {kind: 'transfer', ...loadNftTransferMessage(slice)};
            case OPCODE_OWNER_ASSIGNED:
                return {kind: 'ownerAssigned', ...loadNftOwnerAssignedMessage(slice)};
            case OPCODE_REPORT_STATIC_DATA:
                return {kind: 'reportStaticData', ...loadNftReportStaticDataMessage(slice)};
            case OPCODE_GET_STATIC_DATA:
                return {kind: 'getStaticData', ...loadNftGetStaticDataMessage(slice)};
        }

        if (slice.remainingBits === (256 + 11) && slice.remainingRefs === 1) {
            return {kind: 'deploy', ...loadNftDeployMessage(slice)};
        }
    } catch (e) {
    }

    return {kind: 'unknown'};
}
