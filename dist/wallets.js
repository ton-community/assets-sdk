"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWalletV4 = exports.createHighloadV2 = void 0;
const core_1 = require("@ton/core");
const ton_1 = require("@ton/ton");
const key_1 = require("./key");
const HighloadV2_1 = require("./HighloadV2");
const send_1 = require("./send");
async function createHighloadV2(key) {
    const wk = await (0, key_1.importKey)(key);
    const wallet = HighloadV2_1.HighloadWalletV2.create({
        workchain: 0,
        publicKey: wk.publicKey,
    });
    return {
        wallet,
        keyPair: wk,
        senderCreator: (provider) => {
            return {
                send: async (args) => {
                    await wallet.sendTransferAndWait(provider, {
                        secretKey: wk.secretKey,
                        sendMode: args.sendMode,
                        messages: [(0, core_1.internal)({
                                to: args.to,
                                value: args.value,
                                bounce: args.bounce,
                                init: args.init,
                                body: args.body,
                            })],
                    });
                },
                address: wallet.address,
            };
        },
    };
}
exports.createHighloadV2 = createHighloadV2;
async function createWalletV4(key) {
    const wk = await (0, key_1.importKey)(key);
    const wallet = ton_1.WalletContractV4.create({
        workchain: 0,
        publicKey: wk.publicKey,
    });
    return {
        wallet,
        keyPair: wk,
        senderCreator: (provider) => {
            return {
                send: async (args) => {
                    await (0, send_1.sendAndWait)(wallet, provider, wk.secretKey, args);
                },
                address: wallet.address,
            };
        },
    };
}
exports.createWalletV4 = createWalletV4;
