"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SbtCollection = void 0;
const core_1 = require("@ton/core");
const NftCollectionBase_1 = require("./NftCollectionBase");
const NftItem_1 = require("./NftItem");
function sbtItemParamsToCell(params) {
    return (0, core_1.beginCell)()
        .storeAddress(params.owner)
        .storeRef(typeof params.individualContent === 'string' ? (0, core_1.beginCell)().storeStringTail(params.individualContent) : params.individualContent)
        .storeAddress(params.authority)
        .endCell();
}
class SbtCollection extends NftCollectionBase_1.NftCollectionBase {
    static create(params, sender, contentResolver) {
        const data = (0, core_1.beginCell)()
            .storeAddress(params.admin)
            .storeUint(0, 64)
            .storeRef(params.content)
            .storeRef(NftItem_1.NftItem.sbtCode)
            .storeRef((0, core_1.beginCell)()
            .storeUint(params.royalty?.numerator ?? 0, 16)
            .storeUint(params.royalty?.denominator ?? 1, 16)
            .storeAddress(params.royalty?.recipient ?? params.admin))
            .endCell();
        const init = { data, code: SbtCollection.code };
        return new SbtCollection((0, core_1.contractAddress)(0, init), sender, init, contentResolver);
    }
    static open(address, sender, contentResolver) {
        return new SbtCollection(address, sender, undefined, contentResolver);
    }
    paramsToCell(params) {
        return sbtItemParamsToCell(params);
    }
}
exports.SbtCollection = SbtCollection;
