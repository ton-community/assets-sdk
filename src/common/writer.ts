import { writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * A function that writes files to the given path.
 */
export type Writer = (path: string, content: Buffer) => void;

/**
 * Creates a writer that writes files to the given base path.
 * @param basePath The base path to write files to.
 * @returns A writer that writes files to the given base path.
 */
export function writer(basePath: string): Writer {
    return (path: string, content: Buffer) => writeFileSync(resolve(basePath, path), content);
}
