import {Address, beginCell, Sender, SenderArguments, storeStateInit, toNano} from "@ton/core";
import {AssetsSDK, createApi, PinataStorageParams} from "../src";

/**
 * This is a mock for the TonConnect UI, which is used to send transactions.
 * You must replace this with the actual TonConnectUI from @tonconnect/ui.
 * Example:
 *  ```
 *  import {TonConnectUI} from '@tonconnect/ui';
 *
 *  const provider = new TonConnectUI();
 *  ```
 *  See https://github.com/ton-connect/sdk for more information.
 */
declare class TonConnectUI {
    account: {
        address: string | null;
    } | null;

    sendTransaction(params: {
        validUntil: number,
        from: string | undefined,
        messages: {
            address: string,
            amount: string,
            stateInit: string | undefined,
            payload: string | undefined,
        }[],
    }): Promise<void>;
}

/**
 * Sender implementation for TonConnect.
 * This class is used to send messages using the TonConnect UI.
 */
class TonConnectProvider implements Sender {

    /**
     * The TonConnect UI instance.
     * @private
     */
    private readonly provider: TonConnectUI;

    /**
     * The address of the current account.
     */
    public get address(): Address | undefined {
        const address = this.provider.account?.address;
        return address ? Address.parse(address) : undefined;
    }

    /**
     * Creates a new TonConnectProvider.
     * @param provider
     */
    public constructor(provider: TonConnectUI) {
        this.provider = provider;
    }

    /**
     * Sends a message using the TonConnect UI.
     * @param args
     */
    public async send(args: SenderArguments): Promise<void> {
        // The transaction is valid for 10 minutes.
        const validUntil = Math.floor(Date.now() / 1000) + 600;

        // The address of the recipient, should be in bounceable format for all smart contracts.
        const address = args.to.toString({urlSafe: true, bounceable: true});

        // The address of the sender, if available.
        const from = this.address?.toRawString();

        // The amount to send in nano tokens.
        const amount = args.value.toString();

        // The state init cell for the contract.
        let stateInit: string | undefined;
        if (args.init) {
            // State init cell for the contract.
            const stateInitCell = beginCell().store(storeStateInit(args.init)).endCell();
            // Convert the state init cell to boc base64.
            stateInit = stateInitCell.toBoc().toString('base64');
        }

        // The payload for the message.
        let payload: string | undefined;
        if (args.body) {
            // Convert the message body to boc base64.
            payload = args.body.toBoc().toString('base64');
        }

        // Send the message using the TonConnect UI and wait for the message to be sent.
        await this.provider.sendTransaction({
            validUntil: validUntil,
            from: from,
            messages: [{
                address: address,
                amount: amount,
                stateInit: stateInit,
                payload: payload,
            }],
        });
    }
}

async function main() {
    const NETWORK = 'testnet';
    const api = await createApi(NETWORK);

    const provider = new TonConnectUI();
    const sender = new TonConnectProvider(provider);

    const storage: PinataStorageParams = {
        pinataApiKey: process.env.PINATA_API_KEY!,
        pinataSecretKey: process.env.PINATA_SECRET!,
    }

    const sdk = AssetsSDK.create({
        api: api,
        storage: storage,
        sender: sender,
    });

    console.log('Using wallet', sdk.sender?.address);

    const jetton = await sdk.deployJetton({
        name: 'Test jetton 4',
        decimals: 9,
        description: 'Test jetton',
        symbol: 'TEST',
    }, {adminAddress: sender.address, premintAmount: toNano('100')});

    console.log('Created jetton with address', jetton.address);
}

main().catch(console.error);
