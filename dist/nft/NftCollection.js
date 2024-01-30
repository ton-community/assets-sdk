"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftCollection = void 0;
const core_1 = require("@ton/core");
const NftCollectionBase_1 = require("./NftCollectionBase");
const NftItem_1 = require("./NftItem");
function nftItemParamsToCell(params) {
    return (0, core_1.beginCell)()
        .storeAddress(params.owner)
        .storeRef(typeof params.individualContent === 'string' ? (0, core_1.beginCell)().storeStringTail(params.individualContent) : params.individualContent)
        .endCell();
}
class NftCollection extends NftCollectionBase_1.NftCollectionBase {
    static create(params, sender, contentResolver) {
        const data = (0, core_1.beginCell)()
            .storeAddress(params.admin)
            .storeUint(0, 64)
            .storeRef(params.content)
            .storeRef(NftItem_1.NftItem.nftCode)
            .storeRef((0, core_1.beginCell)()
            .storeUint(params.royalty?.numerator ?? 0, 16)
            .storeUint(params.royalty?.denominator ?? 1, 16)
            .storeAddress(params.royalty?.recipient ?? params.admin))
            .endCell();
        const init = { data, code: NftCollection.code };
        return new NftCollection((0, core_1.contractAddress)(0, init), sender, init, contentResolver);
    }
    static open(address, sender, contentResolver) {
        return new NftCollection(address, sender, undefined, contentResolver);
    }
    paramsToCell(params) {
        return nftItemParamsToCell(params);
    }
}
exports.NftCollection = NftCollection;
