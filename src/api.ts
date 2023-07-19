import { Address, Cell, Contract } from "ton-core";
import { ExtendedContractProvider } from "./ExtendedContractProvider";

export type ExtendedOpenedContract<F> = {
    [P in keyof F]: P extends `${'get' | 'send'}${string}` ? (F[P] extends (x: ExtendedContractProvider, ...args: infer P) => infer R ? (...args: P) => R : never) : F[P];
};

export interface API {
    open<T extends Contract>(contract: T): ExtendedOpenedContract<T>;
    provider(address: Address, init?: { code: Cell; data: Cell; } | null | undefined): ExtendedContractProvider;
}
