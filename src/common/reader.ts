import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Creates a reader that reads files from the given base path.
 * @param basePath The base path to read files from.
 * @returns A reader that reads files from the given base path.
 */
export function reader(basePath: string): (path: string) => string {
    return (path: string) => readFileSync(resolve(basePath, path)).toString();
}
