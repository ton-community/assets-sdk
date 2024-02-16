import {Address, Dictionary} from "@ton/core";
import z from "zod";
import {bufferToStr, DecodedContent, decodeImage, decodeSimpleFields, ParsedContent} from "../content";

export interface JettonContent {
    uri?: string,
    name?: string,
    description?: string,
    image?: string,
    imageData?: Buffer,
    symbol?: string,
    decimals?: number,
    amountStyle?: 'n' | 'n-of-total' | '%',
    renderType?: 'currency' | 'game',
    onchainContent?: boolean;
}

export function jettonContentToInternal(content: JettonContent) {
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

export type ParsedJettonContent = {
    name?: string,
    description?: string,
    image?: string | Buffer,
    symbol?: string,
    decimals?: number,
    amount_style?: 'n' | 'n-of-total' | '%',
    render_type?: 'currency' | 'game',
};

export function parseJettonContent(dc: DecodedContent): ParsedContent<ParsedJettonContent> {
    const decoded: ParsedJettonContent = decodeSimpleFields(dc, {
        name: {
            onchain: bufferToStr,
            offchain: (v: unknown) => z.string().parse(v),
        },
        description: {
            onchain: bufferToStr,
            offchain: (v: unknown) => z.string().parse(v),
        },
        symbol: {
            onchain: bufferToStr,
            offchain: (v: unknown) => z.string().parse(v),
        },
        decimals: {
            onchain: (v: Buffer) => parseInt(bufferToStr(v)),
            offchain: (v: unknown) => z.union([z.string(), z.number()]).transform(v => Number(v)).parse(v),
        },
        amount_style: {
            onchain: (v: Buffer) => {
                const s = bufferToStr(v);
                if (!['n', 'n-of-total', '%'].includes(s)) {
                    throw new Error('Unknown amount_style: ' + s);
                }
                return s;
            },
            offchain: (v: unknown) => z.union([z.literal('n'), z.literal('n-of-total'), z.literal('%')]).parse(v),
        },
        render_type: {
            onchain: (v: Buffer) => {
                const s = bufferToStr(v);
                if (!['currency', 'game'].includes(s)) {
                    throw new Error('Unknown render_type: ' + s);
                }
                return s;
            },
            offchain: (v: unknown) => z.union([z.literal('currency'), z.literal('game')]).parse(v),
        },
    });
    decoded.image = decodeImage(dc);

    const out: ParsedContent<ParsedJettonContent> = {
        ...decoded,
        type: dc.type,
        unknownOffchainFields: dc.offchainFields ?? {},
        unknownOnchainFields: dc.onchainFields ?? Dictionary.empty(),
        offchainUrl: dc.offchainUrl,
    };
    return out;
}
