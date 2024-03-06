"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJettonContent = exports.jettonContentToInternal = void 0;
const core_1 = require("@ton/core");
const zod_1 = __importDefault(require("zod"));
const content_1 = require("../content");
function jettonContentToInternal(content) {
    return {
        uri: content.uri,
        name: content.name,
        description: content.description,
        image: content.image,
        image_data: content.imageData?.toString('base64'),
        symbol: content.symbol,
        decimals: content.decimals?.toString(),
        amount_style: content.amountStyle,
        render_type: content.renderType,
    };
}
exports.jettonContentToInternal = jettonContentToInternal;
function parseJettonContent(dc) {
    const decoded = (0, content_1.decodeSimpleFields)(dc, {
        name: {
            onchain: content_1.bufferToStr,
            offchain: (v) => zod_1.default.string().parse(v),
        },
        description: {
            onchain: content_1.bufferToStr,
            offchain: (v) => zod_1.default.string().parse(v),
        },
        symbol: {
            onchain: content_1.bufferToStr,
            offchain: (v) => zod_1.default.string().parse(v),
        },
        decimals: {
            onchain: (v) => parseInt((0, content_1.bufferToStr)(v)),
            offchain: (v) => zod_1.default.union([zod_1.default.string(), zod_1.default.number()]).transform(v => Number(v)).parse(v),
        },
        amount_style: {
            onchain: (v) => {
                const s = (0, content_1.bufferToStr)(v);
                if (!['n', 'n-of-total', '%'].includes(s)) {
                    throw new Error('Unknown amount_style: ' + s);
                }
                return s;
            },
            offchain: (v) => zod_1.default.union([zod_1.default.literal('n'), zod_1.default.literal('n-of-total'), zod_1.default.literal('%')]).parse(v),
        },
        render_type: {
            onchain: (v) => {
                const s = (0, content_1.bufferToStr)(v);
                if (!['currency', 'game'].includes(s)) {
                    throw new Error('Unknown render_type: ' + s);
                }
                return s;
            },
            offchain: (v) => zod_1.default.union([zod_1.default.literal('currency'), zod_1.default.literal('game')]).parse(v),
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
exports.parseJettonContent = parseJettonContent;
