/// <reference types="node" />
import { KeyPair } from "@ton/crypto";
export declare function importKey(key: string | string[] | Buffer): Promise<KeyPair>;
