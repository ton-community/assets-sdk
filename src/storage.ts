import PinataClient from '@pinata/sdk';
import { Readable } from 'stream';
import { S3 } from '@aws-sdk/client-s3';

export interface Storage {
    uploadFile(contents: Buffer): Promise<string>;
}

export class PinataStorage implements Storage {
    private readonly client: PinataClient;

    constructor(apiKey: string, secretApiKey: string) {
        this.client = new PinataClient(apiKey, secretApiKey);
    }

    async uploadFile(contents: Buffer): Promise<string> {
        return 'ipfs://' + (await this.client.pinFileToIPFS(Readable.from(contents), {
            pinataMetadata: {
                name: 'GameFi SDK Jetton',
            }
        })).IpfsHash;
    }
}

export class S3Storage implements Storage {
    private readonly bucket: string;
    private readonly s3: S3;

    constructor(accessKeyId: string, secretAccessKey: string, bucket: string) {
        this.bucket = bucket;
        this.s3 = new S3({
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    async uploadFile(contents: Buffer): Promise<string> {
        const key = 'jetton/' + Math.random().toString(36).substring(2);

        await this.s3.putObject({
            Bucket: this.bucket,
            Key: key,
            Body: contents,
        });

        return 'https://' + this.bucket + '.s3.amazonaws.com/' + key;
    }
}
