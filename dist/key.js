"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importKey = void 0;
const crypto_1 = require("@ton/crypto");
async function importKey(key) {
    if (typeof key === 'string') {
        return await (0, crypto_1.mnemonicToWalletKey)(key.split(' '));
    }
    else if (Array.isArray(key)) {
        return await (0, crypto_1.mnemonicToWalletKey)(key);
    }
    else {
        return (0, crypto_1.keyPairFromSecretKey)(key);
    }
}
exports.importKey = importKey;
