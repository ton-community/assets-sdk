import type { Readable } from 'stream';

import type PinataClient from '@pinata/sdk';

import { defer, Deferred } from '../utils';
import { Storage } from './storage';

export interface PinataStorageParams {
    pinataApiKey: string;
    pinataSecretKey: string;
}

export class PinataStorage implements Storage {
    private readonly apiKey: string;

    private readonly secretApiKey: string;

    private readonly client: Deferred<PinataClient> = defer(async () => {
        const pinata = await import('@pinata/sdk').then((m) => m.default);
        return new pinata(this.apiKey, this.secretApiKey);
    });

    private readonly stream: Deferred<Readable, [Buffer]> = defer(async (contents: Buffer) => {
        const stream = await import('stream').then((m) => m.Readable);
        return stream.from(contents);
    });

    constructor(apiKey: string, secretApiKey: string) {
        this.apiKey = apiKey;
        this.secretApiKey = secretApiKey;
    }

    public static create(params: PinataStorageParams) {
        return new PinataStorage(params.pinataApiKey, params.pinataSecretKey);
    }

    async uploadFile(contents: Buffer): Promise<string> {
        const client = await this.client();
        const stream = await this.stream(contents);

        const result = await client.pinFileToIPFS(stream, {
            pinataMetadata: {
                name: 'Assets SDK Jetton',
            },
        });
        return 'ipfs://' + result.IpfsHash;
    }
}
