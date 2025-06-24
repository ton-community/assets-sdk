#!/usr/bin/env node

import 'dotenv/config';
import { main as cancelNftSale } from './cancel-nft-sale';
import { main as deployJetton } from './deploy-jetton';
import { main as deployNftCollection } from './deploy-nft-collection';
import { main as getWalletState } from './get-wallet-state';
import { main as getJetton } from './get-jetton';
import { main as getJettonBalance } from './get-jetton-balance';
import { main as getNftCollection } from './get-nft-collection';
import { main as getNftCollectionItem } from './get-nft-collection-item';
import { main as getNftCollectionItems } from './get-nft-collection-items';
import { main as getNftItem } from './get-nft-item';
import { main as getNftSale } from './get-nft-sale';
import { main as mintJetton } from './mint-jetton';
import { main as mintNft } from './mint-nft';
import { main as mintSbt } from './mint-sbt';
import { main as putNftForSale } from './put-nft-for-sale';
import { main as setupEnv } from './setup-env';
import { main as transferJetton } from './transfer-jetton';
import { main as transferNft } from './transfer-nft';
import { main as transferTon } from './transfer-ton';

const commands = {
    'setup-env': {
        main: setupEnv,
        description: 'Sets up the environment for the application',
    },
    'get-wallet-state': {
        main: getWalletState,
        description: 'Print your wallet type and balance',
    },
    'cancel-nft-sale': {
        main: cancelNftSale,
        description: 'Cancels an existing NFT sale',
    },
    'deploy-jetton': {
        main: deployJetton,
        description: 'Create and deploy a new jetton',
    },
    'deploy-nft-collection': {
        main: deployNftCollection,
        description: 'Create and deploy a new NFT collection',
    },
    'get-jetton': {
        main: getJetton,
        description: 'Print details of an existing jetton',
    },
    'get-jetton-balance': {
        main: getJettonBalance,
        description: 'Print balance of a specific jetton wallet',
    },
    'get-nft-collection': {
        main: getNftCollection,
        description: 'Print details of an existing NFT collection',
    },
    'get-nft-collection-item': {
        main: getNftCollectionItem,
        description: 'Print details of an item from the NFT collection',
    },
    'get-nft-collection-items': {
        main: getNftCollectionItems,
        description: 'Print details of all items from the NFT collection',
    },
    'get-nft-item': {
        main: getNftItem,
        description: 'Print details of an NFT item',
    },
    'get-nft-sale': {
        main: getNftSale,
        description: 'Print details of an NFT sale',
    },
    'mint-jetton': {
        main: mintJetton,
        description: 'Mint jettons and sends them to the wallet',
    },
    'mint-nft': {
        main: mintNft,
        description: 'Mint NFT to the wallet',
    },
    'mint-sbt': {
        main: mintSbt,
        description: 'Mint SBT to the wallet',
    },
    'put-nft-for-sale': {
        main: putNftForSale,
        description: 'Puts an NFT item for sale',
    },
    'transfer-jetton': {
        main: transferJetton,
        description: 'Transfer jetton to another wallet',
    },
    'transfer-nft': {
        main: transferNft,
        description: 'Transfer NFT to another wallet',
    },
    'transfer-ton': {
        main: transferTon,
        description: 'Transfer TON to another wallet',
    },
};

function help() {
    // eslint-disable-next-line no-console
    console.log(`Usage: assets-cli <command>\nCommands:`);
    for (let cmd in commands) {
        const commandInfo = commands[cmd as keyof typeof commands];
        // eslint-disable-next-line no-console
        console.log(
            `  - ${cmd} ${Array(30 - cmd.length)
                .fill(' ')
                .join('')}${commandInfo.description}`,
        );
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
        // eslint-disable-next-line no-console
        console.error(e);
        process.exit(1);
    });
} else {
    throw new Error(`Unknown command: ${command}`);
}
