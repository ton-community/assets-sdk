/// <reference types="node" />
import { DecodedContent, ParsedContent } from "../content";
export interface JettonContent {
    uri?: string;
    name?: string;
    description?: string;
    image?: string;
    imageData?: Buffer;
    symbol?: string;
    decimals?: number;
    amountStyle?: 'n' | 'n-of-total' | '%';
    renderType?: 'currency' | 'game';
}
export declare function jettonContentToInternal(content: JettonContent): {
    uri: string | undefined;
    name: string | undefined;
    description: string | undefined;
    image: string | undefined;
    image_data: string | undefined;
    symbol: string | undefined;
    decimals: string | undefined;
    amount_style: "n" | "n-of-total" | "%" | undefined;
    render_type: "currency" | "game" | undefined;
};
export type ParsedJettonContent = {
    name?: string;
    description?: string;
    image?: string | Buffer;
    symbol?: string;
    decimals?: number;
    amount_style?: 'n' | 'n-of-total' | '%';
    render_type?: 'currency' | 'game';
};
export declare function parseJettonContent(dc: DecodedContent): ParsedContent<ParsedJettonContent>;
