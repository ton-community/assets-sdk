# assets-sdk

Assets SDK provides developer friendly APIs to help interact game developers with different assets on TON, such as NFTs/SBTs and jettons. An example game using it can be found [here](https://github.com/ton-community/flappy-bird-phaser).

## Installation

Install the package using npm:
```
npm i @ton-community/assets-sdk
```

If you are using the SDK as a CLI tool, you need to set up the environment first. You can do that by running the following command:)
```bash
npx assets-cli setup-env
```

## Usage

In order to start using this SDK, you need to acquire an instance of `AssetsSDK` in your code. That will require specifying a storage (we currently support Pinata and S3 out of the box, but you can implement your own using our interface), an API (mainnet or testnet), and a wallet (V4 is supported out of the box). For example:
```typescript
import {AssetsSDK, PinataStorageParams, createApi, createSender, createWalletV4, importKey} from "@ton-community/assets-sdk";

// create an instance of the TonClient4
const NETWORK = 'testnet';
const api = await createApi(NETWORK);

// create a sender from the wallet (in this case, Highload Wallet V2)
const keyPair = await importKey(process.env.MNEMONIC);
const sender = await createSender('highload-v2', keyPair, api);

// define the storage parameters (in this case, Pinata)
const storage: PinataStorageParams = {
    pinataApiKey: process.env.PINATA_API_KEY!,
    pinataSecretKey: process.env.PINATA_SECRET!,
}

// create the SDK instance
const sdk = AssetsSDK.create({
    api: api,          // required, the TonClient4 instance
    storage: storage,  // optional, the storage instance (Pinata, S3 or your own)
    sender: sender,    // optional, the sender instance (WalletV4, TonConnect or your own)
});
```

(This is taken directly out of our [example](./examples/mint-jetton.ts), and you can find more in that directory)

Here, you would pass your Pinata keys and the wallet mnemonic (space separated) as env variables.

> Don't use the mnemonic in browser environment, use [TonConnect](https://github.com/ton-connect/sdk) instead.

After you do that, you can:
- create a jetton minter or an NFT/SBT collection (as in the example mentioned above) using the methods `createJetton` or `createNftCollection`/`createSbtCollection`
- open an existing jetton minter, jetton wallet, NFT/SBT collection or NFT/SBT item in order to perform some action on them (mint, transfer, burn, etc)

### Using with TonConnect

The SDK can be used with [TonConnect](https://github.com/ton-connect/sdk) to send messages to the TON blockchain. To do that, you need to create a [TonConnectProvider](./examples/use-tonconnect.ts) instance and pass it to the SDK. For example:
```typescript
// create a new instance of TonConnectUI
const provider = new TonConnectUI();
// create a new instance of TonConnectProvider
const sender = new TonConnectProvider(provider);

const sdk = await AssetsSDK.create({
    // provide the sender to the SDK  
    sender,
});
```

Now, the SDK will use TonConnect to send messages to the TON blockchain.

### Storing to cells and loading from cells

The SDK also provides a way to store messages in cells and load them from cells. For example:

#### Storing a message in a cell

```typescript
import {beginCell} from "@ton/core";
import {storeJettonMintMessage, loadJettonMintMessage} from "@ton-community/assets-sdk";

// storing a jetton mint message in a cell
const mintMessage: Cell = beginCell()
    .store(storeJettonMintMessage({
        to: Address.parse('RECIEVER_ADDRESS'),
        amount: toNano(1)
    })).endCell()
// getting the base64 representation of the boc
mintMessage.toBoc().toString('base64')
```

#### Loading a message from a cell

```typescript
import {Cell} from "@ton/core";
import {loadJettonMintMessage} from "@ton-community/assets-sdk";

// parsing a jetton mint message in a boc base64 to a cell
const mintMessageCell: Cell = Cell.fromBase64('BASE64_BOC');
// loading the message from the cell
const mintMessage: JettonMintMessage = loadJettonMintMessage(mintMessageCell);
```

### Jettons

#### Creating a jetton minter

Call the `createJetton` method on the SDK instance, passing `JettonContent` (all possible fields are `uri`, `name`, `description`, `image`, `imageData`, `symbol`, `decimals`, `amountStyle`, `renderType`, see [TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md#jetton-metadata-attributes) for their description), and any options, such as `onchainContent` (to put the metadata onchain), `adminAddress` (to make a different address the admin), `premint` (to mint some tokens immediately on deploy), and `value` (to specify the amount of TON sent as fee). For example:

```typescript
const jetton = await sdk.createJetton({
    name: 'Test jetton',
    decimals: 9,
    description: 'Test jetton description',
    symbol: 'TEST',
}, {
    premint: {
        to: sdk.sender?.address!,
        amount: toNano('100'),
    },
});
```

#### Open an existing jetton minter

Call the `openJetton` method with the address of the jetton that you wish to open, for example:

```typescript
const jetton = sdk.openJetton(Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'));
```

#### Using the jetton minter instance

Once you have a `Jetton` instance acquired by either creating it or opening one, you can perform the following actions:
- `getWalletAddress` - get a user's jetton wallet address
- `getWallet` - same as above, but immediately opens the address as a jetton wallet
- `getData` - gets the raw onchain data of the jetton
- `sendDeploy` - sends a deploy message; this method is mostly for internal use
- `sendMint` - sends a mint message; this method requires you to be the admin of the jetton
- `sendChangeAdmin` - sends a message to change the admin; this method requires you to be the admin of the jetton
- `sendChangeContent` - sends a message to change the content of the jetton; this method requires you to be the admin of the jetton

#### Using the jetton wallet instance

You can acquire a `JettonWallet` instance either by calling the `openJettonWallet` on the SDK instance with the address of a known jetton wallet, or by calling `getWallet` on a `Jetton` minter instance.

You can then use it to perform the following actions:
- `getData` - get the raw onchain data of the wallet
- `sendTransfer` - send a message to transfer some tokens to another user; this method requires you to be the owner of the jetton wallet
- `sendBurn` - send a message to burn some tokens; this method requires you to be the owner of the jetton wallet

You can also use the `JettonWallet` class itself to do the following:
- `parseTransferBody` - parse the body of a transfer transaction to retrieve the parameters of the transfer
- `parseTransfer` - same as the above, but parse the entire transaction instead of just its body to retrieve additional parameters

### NFTs

#### Creating an NFT/SBT collection

Call the `createNftCollection`/`createSbtCollection`, specifying in the first argument the `collectionContent` (all possible fields are `uri`, `name`, `description`, `image`, `imageData`, see [TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md#nft-metadata-attributes) for their descriptions), passing any options (same as with jettons) as the second argument. For example:

```typescript
const collection = await sdk.createNftCollection({
    collectionContent: {
        name: 'Test collection',
        description: 'Test collection description',
    },
    commonContent: 'https://example.com/nft-items/',
});
```

#### Open an existing NFT/SBT collection

Call the `openNftCollection`/`openSbtCollection` method with the address of the collection that you wish to open, for example:

```typescript
const collection = sdk.openNftCollection(Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'));
```

#### Using the NFT/SBT collection instance

Once you have an `NftCollection`/`SbtCollection` instance, you can perform the following actions:
- `getItemAddress` - get the item's address by its index
- `getItem` - same as above, but open the acquired address as an `NftItem` instance
- `sendMint` - send a message to mint an item; this method requires you to be the collection admin
- `sendBatchMint` - send a message to mint multiple items; this method requires you to be the collection admin
- `sendDeploy` - send a message to deploy the collection, regular users should not normally use this method
- `sendChangeAdmin` - send a message to change the admin of the collection; this method requires you to be the collection admin
- `sendChangeContent` - send a message to change the content of the collection; this method requires you to be the collection admin
- `getData` - get raw onchain data of the jetton minter
- `getItemContent` - get the full item content using the item index and individual item content

#### Using the NFT/SBT item instance

You can acquire an `NftItem` instance either by calling the `getItem` method on a collection instance, or by calling `openNftItem` on the SDK instance.

Using the instance, you can do the following:
- `sendTransfer` - send a message to transfer the item; requires you to be the owner of the item, will not work on an SBT item
- `getData` - get the raw onchain data of the item

## CLI usage

It's also an option to use the SDK as a CLI tool. To do that, pick one of the following options:
```bash
# global installation
npm i -g @ton-community/assets-sdk
assets-cli COMMAND

# local installation
npm install --save-dev @ton-community/assets-sdk
npx assets-cli COMMAND
```

### Commands

> Before running other commands, please run `assets-cli setup-env` first.

| Command                               | Description                                         |
|---------------------------------------|-----------------------------------------------------|
| `assets-cli setup-env`                | Sets up the environment for the application.        |
| `assets-cli get-wallet-state`         | Print your wallet type and balance.                 |
| `assets-cli cancel-nft-sale`          | Cancel an existing NFT sale.                        |
| `assets-cli deploy-jetton`            | Create and deploy a new jetton.                     |
| `assets-cli deploy-nft-collection`    | Create and deploy a new NFT collection.             |
| `assets-cli get-jetton`               | Print details of an existing jetton.                |
| `assets-cli get-jetton-balance`       | Print balance of a specific jetton wallet.          |
| `assets-cli get-nft-collection`       | Print details of an existing NFT collection.        |
| `assets-cli get-nft-collection-item`  | Print details of an item from the NFT collection.   |
| `assets-cli get-nft-collection-items` | Print details of all items from the NFT collection. |
| `assets-cli get-nft-item`             | Print details of an NFT item.                       |
| `assets-cli get-nft-sale`             | Print details of an NFT sale.                       |
| `assets-cli mint-jetton`              | Mint jettons and sends them to the wallet.          |
| `assets-cli mint-nft`                 | Mint NFT to the wallet.                             |
| `assets-cli mint-sbt`                 | Mint SBT to the wallet.                             |
| `assets-cli put-nft-for-sale`         | Puts an NFT item for sale.                          |
| `assets-cli transfer-jetton`          | Transfer jetton to another wallet.                  |
| `assets-cli transfer-nft`             | Transfer NFT to another wallet.                     |
| `assets-cli transfer-ton`             | Transfer TON to another wallet.                     |

## License

[MIT](./LICENSE)
