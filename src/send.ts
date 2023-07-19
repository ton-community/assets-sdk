import { SendMode, MessageRelaxed, Cell, SenderArguments, internal } from "ton-core";
import { ExtendedContractProvider } from "./ExtendedContractProvider";

export interface Wallet {
    createTransfer(args: {
        seqno: number;
        sendMode?: SendMode | null;
        secretKey: Buffer;
        messages: MessageRelaxed[];
        timeout?: number | null;
    }): Cell;
}

function sleep(timeout: number): Promise<void> {
    return new Promise((res) => {
        setTimeout(() => res(), timeout);
    });
}

export async function sendAndWait(wallet: Wallet, provider: ExtendedContractProvider, secretKey: Buffer, args: SenderArguments) {
    let lastBlock = await provider.getLastBlockNumber();
    let state = await provider.getStateOnBlock(lastBlock);
    let seqno = state.state === 'active' ? (await provider.getOnBlock(lastBlock, 'seqno', [])).stack.readNumber() : 0;
    let transfer = wallet.createTransfer({
        seqno,
        secretKey,
        sendMode: args.sendMode ?? undefined,
        messages: [internal({
            to: args.to,
            value: args.value,
            init: args.init,
            body: args.body,
            bounce: args.bounce
        })]
    });
    try {
        await provider.external(transfer);
    } catch (e) {}
    while (true) {
        await sleep(1000);
        const newLastBlock = await provider.getLastBlockNumber();
        if (newLastBlock <= lastBlock) {
            continue;
        }
        lastBlock = newLastBlock;
        const newState = await provider.getStateOnBlock(lastBlock);
        const newSeqno = newState.state === 'active' ? (await provider.getOnBlock(lastBlock, 'seqno', [])).stack.readNumber() : 0;
        if (newSeqno === seqno) {
            try {
                await provider.external(transfer);
            } catch (e) {}
            continue;
        }
        seqno = newSeqno;
        if (newState.lt === null || newState.hash === null) {
            throw new Error('Inconsistent state');
        }
        const txes = await provider.getLastTransactions(newState.lt, newState.hash);
        const knownTx = txes.findIndex((tx) => tx.lt === state.lt);
        state = newState;
        if (knownTx < 0) {
            throw new Error('Too many txes have happened since the last known one');
        }
        if (knownTx === 0) {
            throw new Error('Inconsistent state');
        }
        const unknownTxes = txes.slice(0, knownTx);
        for (const tx of unknownTxes) {
            if (tx.inMessage?.body.equals(transfer)) {
                // success
                return;
            }
        }
        transfer = wallet.createTransfer({
            seqno,
            secretKey,
            sendMode: args.sendMode ?? undefined,
            messages: [internal({
                to: args.to,
                value: args.value,
                init: args.init,
                body: args.body,
                bounce: args.bounce
            })]
        });
        try {
            await provider.external(transfer);
        } catch (e) {}
    }
}
