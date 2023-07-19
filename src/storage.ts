import PinataClient from '@pinata/sdk';
import { Readable } from 'stream';

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
