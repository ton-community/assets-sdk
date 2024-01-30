/// <reference types="node" />
import { Cell, Dictionary } from "@ton/core";
export interface ContentResolver {
    resolve(url: string): Promise<Buffer>;
}
export declare class DefaultContentResolver implements ContentResolver {
    readonly ipfsGateway: (id: string) => string;
    constructor(ipfsGateway?: (id: string) => string);
    resolve(url: string): Promise<Buffer>;
}
type ContentType = 'onchain' | 'offchain' | 'semichain';
export type DecodedContent = {
    type: ContentType;
    onchainFields?: Dictionary<bigint, Buffer>;
    offchainFields?: Record<string, any>;
    offchainUrl?: string;
};
export declare function loadFullContent(data: Cell, contentResolver: ContentResolver): Promise<DecodedContent>;
export type Parser<T> = {
    offchain: (v: unknown) => T;
    onchain: (v: Buffer) => T;
};
export type Parsers = {
    [k: string]: Parser<any>;
};
export declare function decodeSimpleFields(dc: DecodedContent, parsers: Parsers): any;
export declare function decodeImage(dc: DecodedContent): string | Buffer | undefined;
export declare const bufferToStr: (b: Buffer) => string;
export type ParsedContent<T> = T & {
    type: ContentType;
    unknownOnchainFields: Dictionary<bigint, Buffer>;
    unknownOffchainFields: Record<string, any>;
    offchainUrl?: string;
};
export {};
