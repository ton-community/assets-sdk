import { Builder, Slice } from '@ton/core';

import { SetKind, UnknownMessage } from '../types';

export const TEXT_OPCODE = 0x00000000;
export const ENCRYPTED_MESSAGE_OPCODE = 0x2167da4b;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type SimpleTransferMessage = {};

export type TextMessage = {
    text: string;
};

export type EncryptedMessage = {
    data: Buffer;
};

export function storeSimpleTransferMessage(_value: SimpleTransferMessage): (builder: Builder) => void {
    return (_builder: Builder) => {};
}

export function loadSimpleTransferMessage(_slice: Slice): SimpleTransferMessage {
    return {};
}

export function storeTextMessage(value: TextMessage): (builder: Builder) => void {
    return (builder: Builder) => {
        builder.storeUint(0, 32);
        builder.storeStringTail(value.text);
    };
}

export function loadTextMessage(slice: Slice): TextMessage {
    if (slice.loadUint(32) !== 0) {
        throw new Error('Wrong opcode');
    }

    return { text: slice.loadStringTail() };
}

export function storeEncryptedMessage(value: EncryptedMessage): (builder: Builder) => void {
    return (builder: Builder) => {
        builder.storeUint(ENCRYPTED_MESSAGE_OPCODE, 32);
        builder.storeStringTail(value.data.toString('utf-8'));
    };
}

export function loadEncryptedMessage(slice: Slice): EncryptedMessage {
    if (slice.loadUint(32) !== ENCRYPTED_MESSAGE_OPCODE) {
        throw new Error('Wrong opcode');
    }

    const data = slice.loadStringTail();
    return { data: Buffer.from(data, 'utf-8') };
}

export type TransferMessage =
    | SetKind<SimpleTransferMessage, 'simple_transfer'>
    | SetKind<TextMessage, 'text_message'>
    | SetKind<EncryptedMessage, 'encrypted_message'>
    | SetKind<UnknownMessage, 'unknown'>;

export function loadTransferMessage(slice: Slice): TransferMessage {
    if (slice.remainingBits === 0) {
        return { kind: 'simple_transfer' };
    }

    try {
        const opcode = slice.preloadUint(32);
        switch (opcode) {
            case TEXT_OPCODE:
                return { kind: 'text_message', ...loadTextMessage(slice) };
            case ENCRYPTED_MESSAGE_OPCODE:
                return { kind: 'encrypted_message', ...loadEncryptedMessage(slice) };
        }
        // eslint-disable-next-line no-empty
    } catch (_) {}

    return { kind: 'unknown' };
}
