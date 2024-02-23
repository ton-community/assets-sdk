import {Address, Cell, Sender, toNano, Transaction} from "@ton/core";

export type NotifyOptions = {
    amount?: bigint;
    payload?: Cell | null;
};

export type ReturnOptions = {
    address?: Address | null;
};

export type SendTransferOptions = {
    notify?: boolean | NotifyOptions;
    returnExcess?: boolean | ReturnOptions;
};

export function parseNotifyOptions(options: boolean | NotifyOptions | undefined): NotifyOptions | null {
    if (options === false) {
        return null;
    }

    if (typeof options === 'object') {
        return {
            amount: options.amount ?? toNano('0.01'),
            payload: options.payload ?? null,
        };
    }

    return {
        amount: toNano('0.01'),
        payload: null,
    };
}

export function parseExcessReturnOptions(options: boolean | ReturnOptions | undefined, sender: Sender): ReturnOptions | null {
    if (options === false) {
        return null;
    }

    if (typeof options === 'object') {
        return {
            address: options.address ?? sender.address,
        };
    }

    return {
        address: sender.address,
    };
}

export type UnknownMessage = {
    kind: 'unknown';
}

export type UnknownAction = {
    kind: 'unknown';
    transaction: Transaction;
}

export type SetKind<T, K> = T & { kind: K };
