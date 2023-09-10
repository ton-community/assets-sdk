export interface NftContent {
    uri?: string,
    name?: string,
    description?: string,
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
    };
}
