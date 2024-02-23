import {Slice} from "@ton/core";
import {SetKind, UnknownMessage} from "../../common/types";
import {loadNftDeployMessage, NftDeployMessage} from "./NftDeployMessage";
import {loadNftTransferMessage, NftTransferMessage} from "./NftTransferMessage";
import {loadNftGetStaticDataMessage, NftGetStaticDataMessage} from "./NftGetStaticDataMessage";
import {loadNftReportStaticDataMessage, NftReportStaticDataMessage} from "./NftReportStaticDataMessage";
import {loadNftOwnerAssignedMessage, NftOwnerAssignedMessage} from "./NftOwnerAssignedMessage";
import {
    NFT_EXCESSES_OPCODE,
    NFT_GET_STATIC_DATA_OPCODE,
    NFT_OWNER_ASSIGNED_OPCODE,
    NFT_REPORT_STATIC_DATA_OPCODE,
    NFT_TRANSFER_OPCODE
} from "../opcodes";
import {loadNftExcessesMessage, NftExcessesMessage} from "./NftExcessesMessage";

export type NftMessage =
    | SetKind<NftDeployMessage, 'nft_deploy'>
    | SetKind<NftTransferMessage, 'nft_transfer'>
    | SetKind<NftGetStaticDataMessage, 'get_static_data'>
    | SetKind<NftReportStaticDataMessage, 'report_static_data'>
    | SetKind<NftOwnerAssignedMessage, 'owner_assigned'>
    | SetKind<NftExcessesMessage, 'excesses'>
    | SetKind<UnknownMessage, 'unknown'>;

export function loadNftMessage(slice: Slice): NftMessage {
    try {
        const opcode = slice.preloadUint(32);
        switch (opcode) {
            case NFT_TRANSFER_OPCODE:
                return {kind: 'nft_transfer', ...loadNftTransferMessage(slice)};
            case NFT_OWNER_ASSIGNED_OPCODE:
                return {kind: 'owner_assigned', ...loadNftOwnerAssignedMessage(slice)};
            case NFT_REPORT_STATIC_DATA_OPCODE:
                return {kind: 'report_static_data', ...loadNftReportStaticDataMessage(slice)};
            case NFT_GET_STATIC_DATA_OPCODE:
                return {kind: 'get_static_data', ...loadNftGetStaticDataMessage(slice)};
            case NFT_EXCESSES_OPCODE:
                return {kind: 'excesses', ...loadNftExcessesMessage(slice)};
        }

        if (slice.remainingBits === (256 + 11) && slice.remainingRefs === 1) {
            return {kind: 'nft_deploy', ...loadNftDeployMessage(slice)};
        }
    } catch (e) {
    }

    return {kind: 'unknown'};
}
