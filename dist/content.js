"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferToStr = exports.decodeImage = exports.decodeSimpleFields = exports.loadFullContent = exports.DefaultContentResolver = void 0;
const core_1 = require("@ton/core");
const crypto_1 = require("@ton/crypto");
class DefaultContentResolver {
    constructor(ipfsGateway) {
        this.ipfsGateway = ipfsGateway ?? ((id) => `https://ipfs.io/ipfs/${id}`);
    }
    async resolve(url) {
        if (url.startsWith('ipfs://')) {
            url = this.ipfsGateway(url.slice(7));
        }
        if (!(url.startsWith('https://') || url.startsWith('http://'))) {
            throw new Error('Unknown URL: ' + url);
        }
        return Buffer.from(await (await fetch(url)).arrayBuffer());
    }
}
exports.DefaultContentResolver = DefaultContentResolver;
function loadSnake(s) {
    const b = [];
    while (s.remainingBits > 0 || s.remainingRefs > 0) {
        if (s.remainingBits % 8 !== 0) {
            throw new Error('Slice must contain an integer number of bytes');
        }
        b.push(s.loadBuffer(s.remainingBits / 8));
        if (s.remainingRefs === 1) {
            s = s.loadRef().beginParse();
        }
        else if (s.remainingRefs > 1) {
            throw new Error('Slice must contain at most 1 ref');
        }
    }
    return Buffer.concat(b);
}
const BufferValue = {
    serialize: () => {
        throw new Error('Buffer serialization is not supported');
    },
    parse: (src) => {
        const r = src.loadRef().beginParse();
        if (r.remainingBits % 8 !== 0) {
            throw new Error('Slice must contain an integer number of bytes');
        }
        if (r.remainingRefs !== 0) {
            throw new Error('Slice must not contain refs');
        }
        return r.loadBuffer(r.remainingBits / 8);
    },
};
function loadChunked(s) {
    const d = s.loadDict(core_1.Dictionary.Keys.Uint(32), BufferValue);
    const b = [];
    for (let i = 0; i < d.size; i++) {
        const cb = d.get(i);
        if (cb === undefined) {
            throw new Error('Dict must contain sequential keys');
        }
        b.push(cb);
    }
    return Buffer.concat(b);
}
const ContentDataValue = {
    serialize: () => {
        throw new Error('ContentData serialization is not supported');
    },
    parse: (src) => {
        const r = src.loadRef().beginParse();
        const type = r.loadUint(8);
        if (type === 0x00) {
            return loadSnake(r);
        }
        else if (type === 0x01) {
            return loadChunked(r);
        }
        else {
            throw new Error('Unknown ContentData type: ' + type);
        }
    },
};
function bufferToObj(b) {
    const parsed = JSON.parse(b.toString('utf-8'));
    if (typeof parsed !== 'object') {
        throw new Error('Data must be an object');
    }
    return parsed;
}
function hashKey(key) {
    return BigInt('0x' + (0, crypto_1.sha256_sync)(key).toString('hex'));
}
async function loadFullContent(data, contentResolver) {
    const ds = data.beginParse();
    const type = ds.loadUint(8);
    if (type === 0x00) {
        const data = ds.loadDict(core_1.Dictionary.Keys.BigUint(256), ContentDataValue);
        const uri = data.get(hashKey('uri'));
        if (uri !== undefined) {
            const uriStr = uri.toString('utf-8');
            const offchain = await contentResolver.resolve(uriStr);
            return {
                type: 'semichain',
                offchainFields: bufferToObj(offchain),
                onchainFields: data,
                offchainUrl: uriStr,
            };
        }
        return {
            type: 'onchain',
            onchainFields: data,
        };
    }
    else if (type === 0x01) {
        const uri = ds.loadStringTail();
        const data = await contentResolver.resolve(uri);
        return {
            type: 'offchain',
            offchainFields: bufferToObj(data),
            offchainUrl: uri,
        };
    }
    else {
        throw new Error('Unknown FullContent type: ' + type);
    }
}
exports.loadFullContent = loadFullContent;
function decodeSimpleFields(dc, parsers) {
    const out = {};
    for (const k in parsers) {
        if (dc.onchainFields !== undefined) {
            const h = hashKey(k);
            const v = dc.onchainFields.get(h);
            if (v !== undefined) {
                out[k] = parsers[k].onchain(v);
                dc.onchainFields.delete(h);
                continue;
            }
        }
        if (dc.offchainFields !== undefined) {
            if (k in dc.offchainFields) {
                out[k] = parsers[k].offchain(dc.offchainFields[k]);
                delete dc.offchainFields[k];
            }
        }
    }
    return out;
}
exports.decodeSimpleFields = decodeSimpleFields;
function decodeImage(dc) {
    if (dc.onchainFields !== undefined && dc.onchainFields.has(hashKey('image')) && dc.onchainFields.has(hashKey('image_data'))) {
        throw new Error('Onchain fields contain both image and image_data');
    }
    if (dc.offchainFields !== undefined && 'image' in dc.offchainFields && 'image_data' in dc.offchainFields) {
        throw new Error('Offchain fields contain both image and image_data');
    }
    if (dc.onchainFields !== undefined) {
        const image = dc.onchainFields.get(hashKey('image'));
        if (image !== undefined) {
            dc.onchainFields.delete(hashKey('image'));
            return image.toString('utf-8');
        }
        const imageData = dc.onchainFields.get(hashKey('image_data'));
        if (imageData !== undefined) {
            dc.onchainFields.delete(hashKey('image_data'));
            return imageData;
        }
    }
    if (dc.offchainFields !== undefined) {
        if ('image' in dc.offchainFields) {
            const image = dc.offchainFields.image;
            if (typeof image !== 'string') {
                throw new Error('Image URI must be a string');
            }
            delete dc.offchainFields.image;
            return image;
        }
        if ('image_data' in dc.offchainFields) {
            const imageData = dc.offchainFields.image_data;
            if (typeof imageData !== 'string') {
                throw new Error('Offchain image data must be a string');
            }
            delete dc.offchainFields.image_data;
            return Buffer.from(imageData, 'base64');
        }
    }
    return undefined;
}
exports.decodeImage = decodeImage;
const bufferToStr = (b) => b.toString('utf-8');
exports.bufferToStr = bufferToStr;
