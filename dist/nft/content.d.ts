/// <reference types="node" />
import { DecodedContent, ParsedContent } from "../content";
export interface NftContent {
    uri?: string;
    name?: string;
    description?: string;
    social_links?: string[];
    image?: string;
    imageData?: Buffer;
}
export declare function nftContentToInternal(content: NftContent): {
    uri: string | undefined;
    name: string | undefined;
    description: string | undefined;
    image: string | undefined;
    image_data: string | undefined;
    social_links: string[] | undefined;
};
export type ParsedNftContent = {
    name?: string;
    description?: string;
    image?: string | Buffer;
};
export declare function parseNftContent(dc: DecodedContent): ParsedContent<ParsedNftContent>;
