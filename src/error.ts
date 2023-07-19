export class NoSenderError extends Error {
    constructor() {
        super('Sender is not set');
    }
}
