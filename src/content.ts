import { Cell, Dictionary, DictionaryValue, Slice } from "@ton/core";
import { sha256_sync } from "@ton/crypto";

export interface ContentResolver {
    resolve(url: string): Promise<Buffer>;
}

export class DefaultContentResolver implements ContentResolver {
    readonly ipfsGateway: (id: string) => string;

    constructor(ipfsGateway?: (id: string) => string) {
        this.ipfsGateway = ipfsGateway ?? ((id: string) => `https://ipfs.io/ipfs/${id}`);
    }

    async resolve(url: string): Promise<Buffer> {
        if (url.startsWith('ipfs://')) {
            url = this.ipfsGateway(url.slice(7));
        }

        if (!(url.startsWith('https://') || url.startsWith('http://'))) {
            throw new Error('Unknown URL: ' + url);
        }

        return Buffer.from(await (await fetch(url)).arrayBuffer());
    }
}

type ContentType = 'onchain' | 'offchain' | 'semichain';

export type DecodedContent = {
    type: ContentType,
    onchainFields?: Dictionary<bigint, Buffer>,
    offchainFields?: Record<string, any>,
    offchainUrl?: string,
};

function loadSnake(s: Slice): Buffer {
    const b: Buffer[] = []
    while (s.remainingBits > 0 || s.remainingRefs > 0) {
        if (s.remainingBits % 8 !== 0) {
            throw new Error('Slice must contain an integer number of bytes');
        }
        b.push(s.loadBuffer(s.remainingBits / 8));
        if (s.remainingRefs === 1) {
            s = s.loadRef().beginParse();
        } else if (s.remainingRefs > 1) {
            throw new Error('Slice must contain at most 1 ref');
        }
    }
    return Buffer.concat(b);
}

const BufferValue: DictionaryValue<Buffer> = {
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

function loadChunked(s: Slice): Buffer {
    const d = s.loadDict(Dictionary.Keys.Uint(32), BufferValue);
    const b: Buffer[] = [];
    for (let i = 0; i < d.size; i++) {
        const cb = d.get(i);
        if (cb === undefined) {
            throw new Error('Dict must contain sequential keys');
        }
        b.push(cb);
    }
    return Buffer.concat(b);
}

const ContentDataValue: DictionaryValue<Buffer> = {
    serialize: () => {
        throw new Error('ContentData serialization is not supported');
    },
    parse: (src) => {
        const r = src.loadRef().beginParse();
        const type = r.loadUint(8);
        if (type === 0x00) {
            return loadSnake(r);
        } else if (type === 0x01) {
            return loadChunked(r);
        } else {
            throw new Error('Unknown ContentData type: ' + type);
        }
    },
};

function bufferToObj(b: Buffer): Record<string, any> {
    const parsed = JSON.parse(b.toString('utf-8'));
    if (typeof parsed !== 'object') {
        throw new Error('Data must be an object');
    }
    return parsed;
}

function hashKey(key: string): bigint {
    return BigInt('0x' + sha256_sync(key).toString('hex'));
}

export async function loadFullContent(data: Cell, contentResolver: ContentResolver): Promise<DecodedContent> {
    const ds = data.beginParse();
    const type = ds.loadUint(8);
    if (type === 0x00) {
        const data = ds.loadDict(Dictionary.Keys.BigUint(256), ContentDataValue);
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
    } else if (type === 0x01) {
        const uri = ds.loadStringTail();
        const data = await contentResolver.resolve(uri);
        return {
            type: 'offchain',
            offchainFields: bufferToObj(data),
            offchainUrl: uri,
        };
    } else {
        throw new Error('Unknown FullContent type: ' + type);
    }
}

export type Parser<T> = {
    offchain: (v: unknown) => T;
    onchain: (v: Buffer) => T;
};

export type Parsers = {
    [k: string]: Parser<any>;
};

export function decodeSimpleFields(dc: DecodedContent, parsers: Parsers): any {
    const out: any = {};
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

export function decodeImage(dc: DecodedContent): string | Buffer | undefined {
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

export const bufferToStr = (b: Buffer) => b.toString('utf-8');

export type ParsedContent<T> = T & {
    type: ContentType,
    unknownOnchainFields: Dictionary<bigint, Buffer>,
    unknownOffchainFields: Record<string, any>,
    offchainUrl?: string,
};
