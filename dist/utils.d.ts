import { Cell } from "@ton/core";
export declare function sleep(timeout: number): Promise<void>;
export declare function internalOnchainContentToCell(internal: Record<string, string | string[] | number | undefined>): Cell;
