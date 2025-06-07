import { Builder, Slice } from '@ton/core';

export type StoreParams<T> = (params: T) => (builder: Builder) => void;
export type LoadParams<T> = (slice: Slice) => T;
export type ParamsValue<T> = {
    store: StoreParams<T>;
    load: LoadParams<T>;
};
