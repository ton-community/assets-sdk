import {beginCell, Cell, Dictionary} from "@ton/core";
import {sha256_sync} from "@ton/crypto";

export function sleep(timeout: number): Promise<void> {
    return new Promise((res) => {
        setTimeout(() => res(), timeout);
    });
}

export function internalOnchainContentToCell(internal: Record<string, string | number | undefined>): Cell {
    const dict = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());
    for (const k in internal) {
        if ((internal as any)[k] === undefined) {
            continue;
        }
        const b = beginCell();
        if (k === 'image_data') {
            const chunks = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Cell());
            const buf = Buffer.from((internal as any)[k], 'base64');
            for (let i = 0; i * 127 < buf.length; i++) {
                chunks.set(i, beginCell().storeBuffer(buf.subarray(i * 127, (i + 1) * 127)).endCell());
            }
            b.storeUint(1, 8).storeDict(chunks).endCell();
        } else {
            b.storeUint(0, 8).storeStringTail((internal as any)[k].toString());
        }
        dict.set(sha256_sync(k), b.endCell());
    }
    return beginCell().storeUint(0, 8).storeDict(dict).endCell();
}

export type Deferred<T, P extends unknown[] = []> = (...args: P) => Promise<T>;

export type DeferredFactory<T, P extends unknown[] = []> = (...args: P) => Promise<T>;

export function defer<T, P extends unknown[] = []>(factory: DeferredFactory<T, P>): Deferred<T, P> {
    return (...args: P) => factory(...args);
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
