"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoSenderError = void 0;
class NoSenderError extends Error {
    constructor() {
        super('Sender is not set');
    }
}
exports.NoSenderError = NoSenderError;
