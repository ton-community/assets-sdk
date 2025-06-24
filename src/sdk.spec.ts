import '@ton/test-utils';
import { Address, Cell, Contract, ContractProvider, OpenedContract, toNano } from '@ton/core';
import { Blockchain, createMetricStore, makeSnapshotMetric, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { resetMetricStore } from '@ton/sandbox';

import { AssetsSDK } from './sdk';
import { TonClientApi } from './client/ton-client-api';
import { Storage } from './storage/storage';

class Api implements TonClientApi {
    constructor(readonly blockchain: Blockchain) {}
    open<T extends Contract>(contract: T): OpenedContract<T> {
        return this.blockchain.openContract<T>(contract) as OpenedContract<T>;
    }
    provider(address: Address, init?: { code: Cell; data: Cell } | null | undefined): ContractProvider {
        return this.blockchain.provider(address, init);
    }
}

export class FakeStorage implements Storage {
    async uploadFile(_contents: Buffer): Promise<string> {
        return 'FakeStorage';
    }
}

describe('sdk', () => {
    const store = createMetricStore();
    let sdk: AssetsSDK;

    beforeAll(async () => {
        const blockchain = await Blockchain.create();
        const treasury: SandboxContract<TreasuryContract> = await blockchain.treasury('sender')
        const api = new Api(blockchain);
        const storage = new FakeStorage();
        const sender = blockchain.sender(treasury.address);
        sdk = AssetsSDK.create({
            api,
            storage,
            sender,
        });
    });

    afterEach(() => {
        resetMetricStore();
    });

    it('deploy Jetton', async () => {
        await sdk.deployJetton(
            {
                name: 'Jetton',
                decimals: 9,
                symbol: 'JETTON',
            },
            {
                premintAmount: toNano('100'),
            },
        );
        const snapshot = makeSnapshotMetric(store);
        expect(snapshot.items).toMatchSnapshot();
    });

    it('deploy NFT', async () => {
        await sdk.deployNftCollection({
            collectionContent: {
                name: 'NFT',
            },
            commonContent: 'content',
        });
        const snapshot = makeSnapshotMetric(store);
        expect(snapshot.items).toMatchSnapshot();
    });
});
