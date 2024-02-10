export interface Storage {
    uploadFile(contents: Buffer): Promise<string>;
}

