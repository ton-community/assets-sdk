#!/usr/bin/env node

import 'dotenv/config';
import { main as deployJetton } from './deploy-jetton';
import { main as deployNftCollection } from './deploy-nft-collection';
import { main as getWalletState } from './get-wallet-state';
import { main as mintJetton } from './mint-jetton';
import { main as mintNft } from './mint-nft';
import { main as setupEnv } from './setup-env';
import { main as transferJetton } from './transfer-jetton';
import { main as transferNft } from './transfer-nft';

const command = process.argv[2];

switch (command) {
    case 'deploy-jetton':
        deployJetton();
        break;
    case 'deploy-nft-collection':
        deployNftCollection();
        break;
    case 'get-wallet-state':
        getWalletState();
        break;
    case 'mint-jetton':
        mintJetton();
        break;
    case 'mint-nft':
        mintNft();
        break;
    case 'setup-env':
        setupEnv();
        break;
    case 'transfer-jetton':
        transferJetton();
        break;
    case 'transfer-nft':
        transferNft();
        break;
    default: throw new Error(`Unknown command: ${command}`);
}
