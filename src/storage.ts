import type PinataClient from '@pinata/sdk';
import type {S3} from '@aws-sdk/client-s3';
import {Readable} from 'stream';
import {defer, Deferred} from "./utils";

export interface Storage {
    uploadFile(contents: Buffer): Promise<string>;
}

export class PinataStorage implements Storage {
    private readonly apiKey: string;

    private readonly secretApiKey: string;

    private readonly client: Deferred<PinataClient> = defer(async () => {
        const ctor = await import('@pinata/sdk').then((m) => m.default);
        return new ctor(this.apiKey, this.secretApiKey);
    });

    constructor(apiKey: string, secretApiKey: string) {
        this.apiKey = apiKey;
        this.secretApiKey = secretApiKey;
    }

    async uploadFile(contents: Buffer): Promise<string> {
        const client = await this.client();

        return 'ipfs://' + (await client.pinFileToIPFS(Readable.from(contents), {
            pinataMetadata: {
                name: 'Assets SDK Jetton',
            }
        })).IpfsHash;
    }
}

export class S3Storage implements Storage {

    private readonly accessKeyId: string;

    private readonly secretAccessKey: string;

    private readonly bucket: string;

    private readonly s3: Deferred<S3> = defer(async () => {
        const ctor = await import('@aws-sdk/client-s3').then((m) => m.S3);
        return new ctor({
            credentials: {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
            },
        });
    });

    constructor(accessKeyId: string, secretAccessKey: string, bucket: string) {
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.bucket = bucket;
    }

    async uploadFile(contents: Buffer): Promise<string> {
        const s3 = await this.s3();

        const key = 'jetton/' + Math.random().toString(36).substring(2);

        await s3.putObject({
            Bucket: this.bucket,
            Key: key,
            Body: contents,
        });

        return 'https://' + this.bucket + '.s3.amazonaws.com/' + key;
    }
}
