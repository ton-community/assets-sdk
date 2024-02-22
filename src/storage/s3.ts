import {defer, Deferred} from "../utils";
import type {S3} from "@aws-sdk/client-s3";
import {Storage} from "./storage";

export interface S3StorageParams {
    s3AccessKeyId: string
    s3SecretAccessKey: string
    s3Bucket: string
}

export class S3Storage implements Storage {

    private readonly accessKeyId: string;

    private readonly secretAccessKey: string;

    private readonly bucket: string;

    private readonly s3: Deferred<S3> = defer(async () => {
        const s3 = await import('@aws-sdk/client-s3').then((m) => m.S3);
        return new s3({
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

    public static create(params: S3StorageParams) {
        return new S3Storage(params.s3AccessKeyId, params.s3SecretAccessKey, params.s3Bucket);
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
