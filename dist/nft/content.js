"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNftContent = exports.nftContentToInternal = void 0;
const core_1 = require("@ton/core");
const zod_1 = __importDefault(require("zod"));
const content_1 = require("../content");
function nftContentToInternal(content) {
    return {
        uri: content.uri,
        name: content.name,
        description: content.description,
        image: content.image,
        image_data: content.imageData?.toString('base64'),
        social_links: content.social_links,
    };
}
exports.nftContentToInternal = nftContentToInternal;
function parseNftContent(dc) {
    const decoded = (0, content_1.decodeSimpleFields)(dc, {
        name: {
            onchain: content_1.bufferToStr,
            offchain: (v) => zod_1.default.string().parse(v),
        },
        description: {
            onchain: content_1.bufferToStr,
            offchain: (v) => zod_1.default.string().parse(v),
        },
    });
    decoded.image = (0, content_1.decodeImage)(dc);
    const out = {
        ...decoded,
        type: dc.type,
        unknownOffchainFields: dc.offchainFields ?? {},
        unknownOnchainFields: dc.onchainFields ?? core_1.Dictionary.empty(),
        offchainUrl: dc.offchainUrl,
    };
    return out;
}
exports.parseNftContent = parseNftContent;
