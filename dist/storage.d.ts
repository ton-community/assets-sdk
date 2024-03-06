/// <reference types="node" />
export interface Storage {
    uploadFile(contents: Buffer): Promise<string>;
}
export declare class PinataStorage implements Storage {
    private readonly client;
    constructor(apiKey: string, secretApiKey: string);
    uploadFile(contents: Buffer): Promise<string>;
}
export declare class S3Storage implements Storage {
    private readonly bucket;
    private readonly s3;
    constructor(accessKeyId: string, secretAccessKey: string, bucket: string);
    uploadFile(contents: Buffer): Promise<string>;
}
