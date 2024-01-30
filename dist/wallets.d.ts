/// <reference types="node" />
import { SenderArguments } from "@ton/core";
import { WalletContractV4 } from "@ton/ton";
import { ExtendedContractProvider } from "./ExtendedContractProvider";
import { HighloadWalletV2 } from "./HighloadV2";
export declare function createHighloadV2(key: string | string[] | Buffer): Promise<{
    wallet: HighloadWalletV2;
    keyPair: import("@ton/crypto").KeyPair;
    senderCreator: (provider: ExtendedContractProvider) => {
        send: (args: SenderArguments) => Promise<void>;
        address: import("@ton/core").Address;
    };
}>;
export declare function createWalletV4(key: string | string[] | Buffer): Promise<{
    wallet: WalletContractV4;
    keyPair: import("@ton/crypto").KeyPair;
    senderCreator: (provider: ExtendedContractProvider) => {
        send: (args: SenderArguments) => Promise<void>;
        address: import("@ton/core").Address;
    };
}>;
