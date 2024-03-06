import {Dictionary} from "@ton/core";
import z from "zod";
import {bufferToStr, DecodedContent, decodeImage, decodeSimpleFields, ParsedContent} from "../content";

export interface NftContent {
    uri?: string,
    name?: string,
    description?: string,
    social_links?: string[], 
    image?: string,
    imageData?: Buffer,
}

export function nftContentToInternal(content: NftContent) {
    return {
        uri: content.uri,
        name: content.name,
        description: content.description,
        image: content.image,
        image_data: content.imageData?.toString('base64'),
        social_links: content.social_links, 
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
