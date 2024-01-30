"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAndWait = void 0;
const core_1 = require("@ton/core");
const utils_1 = require("./utils");
async function sendAndWait(wallet, provider, secretKey, args) {
    let lastBlock = await provider.getLastBlockNumber();
    let state = await provider.getStateOnBlock(lastBlock);
    let seqno = state.state === 'active' ? (await provider.getOnBlock(lastBlock, 'seqno', [])).stack.readNumber() : 0;
    let transfer = wallet.createTransfer({
        seqno,
        secretKey,
        sendMode: args.sendMode ?? undefined,
        messages: [(0, core_1.internal)({
                to: args.to,
                value: args.value,
                init: args.init,
                body: args.body,
                bounce: args.bounce
            })]
    });
    try {
        await provider.external(transfer);
    }
    catch (e) { }
    while (true) {
        await (0, utils_1.sleep)(1000);
        const newLastBlock = await provider.getLastBlockNumber();
        if (newLastBlock <= lastBlock) {
            continue;
        }
        lastBlock = newLastBlock;
        const newState = await provider.getStateOnBlock(lastBlock);
        const newSeqno = newState.state === 'active' ? (await provider.getOnBlock(lastBlock, 'seqno', [])).stack.readNumber() : 0;
        if (newSeqno === seqno) {
            try {
                await provider.external(transfer);
            }
            catch (e) { }
            continue;
        }
        seqno = newSeqno;
        if (newState.lt === null || newState.hash === null) {
            throw new Error('Inconsistent state');
        }
        const txes = await provider.getLastTransactions(newState.lt, newState.hash);
        const knownTx = txes.findIndex((tx) => tx.lt === state.lt);
        state = newState;
        if (knownTx < 0) {
            throw new Error('Too many txes have happened since the last known one');
        }
        if (knownTx === 0) {
            throw new Error('Inconsistent state');
        }
        const unknownTxes = txes.slice(0, knownTx);
        for (const tx of unknownTxes) {
            if (tx.inMessage?.body.equals(transfer)) {
                // success
                return;
            }
        }
        transfer = wallet.createTransfer({
            seqno,
            secretKey,
            sendMode: args.sendMode ?? undefined,
            messages: [(0, core_1.internal)({
                    to: args.to,
                    value: args.value,
                    init: args.init,
                    body: args.body,
                    bounce: args.bounce
                })]
        });
        try {
            await provider.external(transfer);
        }
        catch (e) { }
    }
}
exports.sendAndWait = sendAndWait;
