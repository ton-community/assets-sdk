import { reader } from '../../common/reader';
import { buildContract } from '../../common/build-contract';
import { writer } from '../../common/writer';

// func -o build/nft-collection-editable-code.fif -SPA ../stdlib.fc params.fc op-codes.fc nft-collection-editable.fc
async function buildNftCollectionEditableContract() {
    return buildContract({
        sources: reader(__dirname),
        writer: writer(__dirname),
        targets: ['../../common/stdlib.fc', './params.fc', './op-codes.fc', './nft-collection-editable.fc'],
        output: './build/nft-collection-editable.ts',
    });
}

// func -o build/nft-item-code.fif -SPA ../stdlib.fc params.fc op-codes.fc nft-item.fc
async function buildNftItemContract() {
    return buildContract({
        sources: reader(__dirname),
        writer: writer(__dirname),
        targets: ['../../common/stdlib.fc', './params.fc', './op-codes.fc', './nft-item.fc'],
        output: './build/nft-item.ts',
    });
}

// func -o build/sbt-item-code.fif -SPA ../stdlib.fc params.fc op-codes.fc sbt-item.fc
async function buildSbtItemContract() {
    return buildContract({
        sources: reader(__dirname),
        writer: writer(__dirname),
        targets: ['../../common/stdlib.fc', './params.fc', './op-codes.fc', './sbt-item.fc'],
        output: './build/sbt-item.ts',
    });
}

async function main() {
    await buildNftCollectionEditableContract();
    await buildNftItemContract();
    await buildSbtItemContract();
}

main().catch((err) => {
    throw err;
});
