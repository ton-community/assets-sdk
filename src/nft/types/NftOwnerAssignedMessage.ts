import { Address, Builder, Cell, Slice } from '@ton/core';

import { NFT_OWNER_ASSIGNED_OPCODE } from '../opcodes';

// ownership_assigned query_id:uint64 prev_owner:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody;
export type NftOwnerAssignedMessage = {
    queryId: bigint;
    previousOwner: Address;
    payload: Cell | null;
};

export function storeNftOwnerAssignedMessage(message: NftOwnerAssignedMessage): (builder: Builder) => void {
    return (builder) => {
        const { queryId, previousOwner, payload } = message;
        builder
            .storeUint(NFT_OWNER_ASSIGNED_OPCODE, 32)
            .storeUint(queryId, 64)
            .storeAddress(previousOwner)
            .storeMaybeRef(payload);
    };
}

export function loadNftOwnerAssignedMessage(slice: Slice): NftOwnerAssignedMessage {
    if (slice.loadUint(32) !== NFT_OWNER_ASSIGNED_OPCODE) {
        throw new Error('Wrong opcode');
    }
    const queryId = slice.loadUintBig(64);
    const previousOwner = slice.loadAddress();
    const eitherPayload = slice.loadBoolean();
    const payload = eitherPayload ? slice.loadRef() : slice.asCell();
    return {
        queryId,
        previousOwner,
        payload,
    };
}
