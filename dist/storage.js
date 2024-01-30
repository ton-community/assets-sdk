"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Storage = exports.PinataStorage = void 0;
const sdk_1 = __importDefault(require("@pinata/sdk"));
const stream_1 = require("stream");
const client_s3_1 = require("@aws-sdk/client-s3");
class PinataStorage {
    constructor(apiKey, secretApiKey) {
        this.client = new sdk_1.default(apiKey, secretApiKey);
    }
    async uploadFile(contents) {
        return 'ipfs://' + (await this.client.pinFileToIPFS(stream_1.Readable.from(contents), {
            pinataMetadata: {
                name: 'GameFi SDK Jetton',
            }
        })).IpfsHash;
    }
}
exports.PinataStorage = PinataStorage;
class S3Storage {
    constructor(accessKeyId, secretAccessKey, bucket) {
        this.bucket = bucket;
        this.s3 = new client_s3_1.S3({
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }
    async uploadFile(contents) {
        const key = 'jetton/' + Math.random().toString(36).substring(2);
        await this.s3.putObject({
            Bucket: this.bucket,
            Key: key,
            Body: contents,
        });
        return 'https://' + this.bucket + '.s3.amazonaws.com/' + key;
    }
}
exports.S3Storage = S3Storage;
