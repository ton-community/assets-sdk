import { Dictionary } from "@ton/core";
import z from "zod";
import { DecodedContent, ParsedContent, decodeSimpleFields, decodeImage, bufferToStr } from "../content";

export interface NftContent {
    uri?: string,
    name?: string,
    description?: string,
    social_links?: string[], 
    image?: string,
    imageData?: Buffer,
}

export function nftContentToInternal(content: NftContent) {
    const social_links = Array.isArray(content.social_links) && content.social_links.every(link => typeof link === 'string') ? JSON.stringify(content.social_links) : undefined
    
    return {
        uri: content.uri,
        name: content.name,
        description: content.description,
        image: content.image,
        image_data: content.imageData?.toString('base64'),
        social_links, 
    };
}

export type ParsedNftContent = {
    name?: string,
    description?: string,
    image?: string | Buffer,
};

export function parseNftContent(dc: DecodedContent): ParsedContent<ParsedNftContent> {
    const decoded: ParsedNftContent = decodeSimpleFields(dc, {
        name: {
            onchain: bufferToStr,
            offchain: (v: unknown) => z.string().parse(v),
        },
        description: {
            onchain: bufferToStr,
            offchain: (v: unknown) => z.string().parse(v),
        },
    });
    decoded.image = decodeImage(dc);
    const out: ParsedContent<ParsedNftContent> = {
        ...decoded,
        type: dc.type,
        unknownOffchainFields: dc.offchainFields ?? {},
        unknownOnchainFields: dc.onchainFields ?? Dictionary.empty(),
        offchainUrl: dc.offchainUrl,
    };
    return out;
}
