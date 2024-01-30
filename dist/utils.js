"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalOnchainContentToCell = exports.sleep = void 0;
const core_1 = require("@ton/core");
const crypto_1 = require("@ton/crypto");
function sleep(timeout) {
    return new Promise((res) => {
        setTimeout(() => res(), timeout);
    });
}
exports.sleep = sleep;
function internalOnchainContentToCell(internal) {
    const dict = core_1.Dictionary.empty(core_1.Dictionary.Keys.Buffer(32), core_1.Dictionary.Values.Cell());
    for (const k in internal) {
        if (internal[k] === undefined) {
            continue;
        }
        if (k === 'social_links') {
            continue;
        }
        const b = (0, core_1.beginCell)();
        if (k === 'image_data') {
            const chunks = core_1.Dictionary.empty(core_1.Dictionary.Keys.Uint(32), core_1.Dictionary.Values.Cell());
            const buf = Buffer.from(internal[k], 'base64');
            for (let i = 0; i * 127 < buf.length; i++) {
                chunks.set(i, (0, core_1.beginCell)().storeBuffer(buf.subarray(i * 127, (i + 1) * 127)).endCell());
            }
            b.storeUint(1, 8).storeDict(chunks).endCell();
        }
        else {
            b.storeUint(0, 8).storeStringTail(internal[k].toString());
        }
        dict.set((0, crypto_1.sha256_sync)(k), b.endCell());
    }
    return (0, core_1.beginCell)().storeUint(0, 8).storeDict(dict).endCell();
}
exports.internalOnchainContentToCell = internalOnchainContentToCell;
