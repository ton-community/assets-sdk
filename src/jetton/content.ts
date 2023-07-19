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
}

export function jettonContentToInternal(content: JettonContent) {
    return {
        uri: content.uri,
        name: content.name,
        description: content.description,
        image: content.image,
        image_data: content.imageData?.toString('base64'),
        symbol: content.symbol,
        decimals: content.decimals,
        amount_style: content.amountStyle,
        render_type: content.renderType,
    };
}
