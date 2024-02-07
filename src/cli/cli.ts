#!/usr/bin/env node

import 'dotenv/config';
import {main as cancelNftSale} from './cancel-nft-sale';
import {main as deployJetton} from './deploy-jetton';
import {main as deployNftCollection} from './deploy-nft-collection';
import {main as getWalletState} from './get-wallet-state';
import {main as getJetton} from './get-jetton';
import {main as getJettonBalance} from './get-jetton-balance';
import {main as getNftCollection} from './get-nft-collection';
import {main as getNftCollectionItem} from './get-nft-collection-item';
import {main as getNftCollectionItems} from './get-nft-collection-items';
import {main as getNftItem} from './get-nft-item';
import {main as getNftSale} from './get-nft-sale';
import {main as mintJetton} from './mint-jetton';
import {main as mintNft} from './mint-nft';
import {main as mintSbt} from './mint-sbt';
import {main as putNftForSale} from './put-nft-for-sale';
import {main as setupEnv} from './setup-env';
import {main as transferJetton} from './transfer-jetton';
import {main as transferNft} from './transfer-nft';
import {main as transferTon} from './transfer-ton';

const commands = {
    'setup-env': {
        main: setupEnv,
        description: 'Sets up the environment for the application',
    },
    'cancel-nft-sale': {
        main: cancelNftSale,
        description: 'Cancels an existing NFT sale',
    },
    'deploy-jetton': {
        main: deployJetton,
        description: 'Deploys a new jetton',
    },
    'deploy-nft-collection': {
        main: deployNftCollection,
        description: 'Deploys a new NFT collection',
    },
    'get-wallet-state': {
        main: getWalletState,
        description: 'Retrieves state of a specific wallet',
    },
    'get-jetton': {
        main: getJetton,
        description: 'Retrieves details of an existing jetton',
    },
    'get-jetton-balance': {
        main: getJettonBalance,
        description: 'Retrieves balance of a specific jetton wallet',
    },
    'get-nft-collection': {
        main: getNftCollection,
        description: 'Retrieves details of an existing NFT collection',
    },
    'get-nft-collection-item': {
        main: getNftCollectionItem,
        description: 'Retrieves an item from the NFT collection',
    },
    'get-nft-collection-items': {
        main: getNftCollectionItems,
        description: 'Retrieves all items from the NFT collection',
    },
    'get-nft-item': {
        main: getNftItem,
        description: 'Retrieves an NFT item',
    },
    'get-nft-sale': {
        main: getNftSale,
        description: 'Retrieves details of an existing NFT sale',
    },
    'mint-jetton': {
        main: mintJetton,
        description: 'Mints jettons and sends them to the wallet',
    },
    'mint-nft': {
        main: mintNft,
        description: 'Mints a new NFT item and sends it to the wallet',
    },
    'mint-sbt': {
        main: mintSbt,
        description: 'Mints a new SBT item and sends it to the wallet',
    },
    'transfer-jetton': {
        main: transferJetton,
        description: 'Transfers jettons from one account to another',
    },
    'transfer-nft': {
        main: transferNft,
        description: 'Transfers an NFT item from one account to another',
    },
    'transfer-ton': {
        main: transferTon,
        description: 'Transfers TONs from one account to another',
    },
    'put-nft-for-sale': {
        main: putNftForSale,
        description: 'Puts an NFT item for sale',
    },
}

function help() {
    console.log(`Usage: assets-cli <command>\nCommands:`);
    for (let cmd in commands) {
        const commandInfo = commands[cmd as keyof typeof commands];
        console.log(`  - ${cmd} ${Array(30 - cmd.length).fill(' ').join('')}${commandInfo.description}`);
    }
}

const command = process.argv[2] as keyof typeof commands | undefined;

if (!command) {
    help();
    process.exit(0);
}

const commandInfo = commands[command];
if (commandInfo) {
    commandInfo.main().catch((e: Error) => {
        console.error(e);
        process.exit(1);
    });
} else {
    throw new Error(`Unknown command: ${command}`);
}
