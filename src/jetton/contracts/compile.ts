import { reader } from '../../common/reader';
import { buildContract } from '../../common/build-contract';
import { writer } from '../../common/writer';

// func -SPA -o ./build/jetton-minter-discoverable.fif ../stdlib.fc params.fc op-codes.fc discovery-params.fc jetton-utils.fc jetton-minter-discoverable.fc
async function buildJettonMasterContract() {
    return buildContract({
        sources: reader(__dirname),
        writer: writer(__dirname),
        targets: [
            '../../common/stdlib.fc',
            './params.fc',
            './op-codes.fc',
            './discovery-params.fc',
            './jetton-utils.fc',
            './jetton-minter-discoverable.fc',
        ],
        output: './build/jetton-minter.ts',
    });
}

// func -SPA -o ./build/jetton-wallet.fif ../stdlib.fc params.fc op-codes.fc jetton-utils.fc jetton-wallet.fc
async function buildJettonWalletContract() {
    return buildContract({
        sources: reader(__dirname),
        writer: writer(__dirname),
        targets: ['../../common/stdlib.fc', './params.fc', './op-codes.fc', './jetton-utils.fc', './jetton-wallet.fc'],
        output: './build/jetton-wallet.ts',
    });
}

async function main() {
    await buildJettonMasterContract();
    await buildJettonWalletContract();
}

main().catch((err) => {
    throw err;
});
