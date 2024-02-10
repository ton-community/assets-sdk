import {Storage} from './storage';

export class NoopStorage implements Storage {
    async uploadFile(contents: Buffer): Promise<string> {
        throw new Error(`No storage provider configured`);
    }
}
