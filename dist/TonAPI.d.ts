/// <reference types="node" />
import { Address as TONAddress } from '@ton/core';
import { AxiosInstance } from 'axios';
export declare class TonAPI {
    readonly instance: AxiosInstance;
    constructor(params?: {
        baseURL?: string;
        token?: string;
    });
    getNftCollections(params?: {
        limit?: number;
        offset?: number;
    }): Promise<{
        address: TONAddress;
        next_item_index: bigint;
        raw_collection_content: Buffer;
        approved_by: string[];
        owner?: {
            address: TONAddress;
            is_scam: boolean;
            is_wallet: boolean;
            name?: string | undefined;
            icon?: string | undefined;
        } | undefined;
        metadata?: Record<string, any> | undefined;
        previews?: {
            resolution: string;
            url: string;
        }[] | undefined;
    }[]>;
    getNftCollection(collection: TONAddress | string): Promise<{
        address: TONAddress;
        next_item_index: bigint;
        raw_collection_content: Buffer;
        approved_by: string[];
        owner?: {
            address: TONAddress;
            is_scam: boolean;
            is_wallet: boolean;
            name?: string | undefined;
            icon?: string | undefined;
        } | undefined;
        metadata?: Record<string, any> | undefined;
        previews?: {
            resolution: string;
            url: string;
        }[] | undefined;
    }>;
    getNftCollectionItems(collection: TONAddress | string, params?: {
        limit?: number;
        offset?: number;
    }): Promise<{
        address: TONAddress;
        metadata: Record<string, any>;
        approved_by: string[];
        index: bigint;
        verified: boolean;
        owner?: {
            address: TONAddress;
            is_scam: boolean;
            is_wallet: boolean;
            name?: string | undefined;
            icon?: string | undefined;
        } | undefined;
        collection?: {
            address: TONAddress;
            name: string;
            description: string;
        } | undefined;
        sale?: {
            address: TONAddress;
            market: {
                address: TONAddress;
                is_scam: boolean;
                is_wallet: boolean;
                name?: string | undefined;
                icon?: string | undefined;
            };
            price: {
                value: bigint;
                token_name: string;
            };
            owner?: {
                address: TONAddress;
                is_scam: boolean;
                is_wallet: boolean;
                name?: string | undefined;
                icon?: string | undefined;
            } | undefined;
        } | undefined;
        previews?: {
            resolution: string;
            url: string;
        }[] | undefined;
        dns?: string | undefined;
    }[]>;
    getNftItems(items: (TONAddress | string)[]): Promise<{
        address: TONAddress;
        metadata: Record<string, any>;
        approved_by: string[];
        index: bigint;
        verified: boolean;
        owner?: {
            address: TONAddress;
            is_scam: boolean;
            is_wallet: boolean;
            name?: string | undefined;
            icon?: string | undefined;
        } | undefined;
        collection?: {
            address: TONAddress;
            name: string;
            description: string;
        } | undefined;
        sale?: {
            address: TONAddress;
            market: {
                address: TONAddress;
                is_scam: boolean;
                is_wallet: boolean;
                name?: string | undefined;
                icon?: string | undefined;
            };
            price: {
                value: bigint;
                token_name: string;
            };
            owner?: {
                address: TONAddress;
                is_scam: boolean;
                is_wallet: boolean;
                name?: string | undefined;
                icon?: string | undefined;
            } | undefined;
        } | undefined;
        previews?: {
            resolution: string;
            url: string;
        }[] | undefined;
        dns?: string | undefined;
    }[]>;
    getNftItem(item: TONAddress | string): Promise<{
        address: TONAddress;
        metadata: Record<string, any>;
        approved_by: string[];
        index: bigint;
        verified: boolean;
        owner?: {
            address: TONAddress;
            is_scam: boolean;
            is_wallet: boolean;
            name?: string | undefined;
            icon?: string | undefined;
        } | undefined;
        collection?: {
            address: TONAddress;
            name: string;
            description: string;
        } | undefined;
        sale?: {
            address: TONAddress;
            market: {
                address: TONAddress;
                is_scam: boolean;
                is_wallet: boolean;
                name?: string | undefined;
                icon?: string | undefined;
            };
            price: {
                value: bigint;
                token_name: string;
            };
            owner?: {
                address: TONAddress;
                is_scam: boolean;
                is_wallet: boolean;
                name?: string | undefined;
                icon?: string | undefined;
            } | undefined;
        } | undefined;
        previews?: {
            resolution: string;
            url: string;
        }[] | undefined;
        dns?: string | undefined;
    }>;
    getJettons(params?: {
        limit?: number;
        offset?: number;
    }): Promise<{
        metadata: {
            symbol: string;
            address: TONAddress;
            name: string;
            decimals: number;
            image?: string | undefined;
            description?: string | undefined;
            social?: string[] | undefined;
            websites?: string[] | undefined;
            catalogs?: string[] | undefined;
        };
        mintable: boolean;
        total_supply: bigint;
        verification: "whitelist" | "blacklist" | "none";
        holders_count: number;
    }[]>;
    getJetton(jettonMaster: TONAddress | string): Promise<{
        metadata: {
            symbol: string;
            address: TONAddress;
            name: string;
            decimals: number;
            image?: string | undefined;
            description?: string | undefined;
            social?: string[] | undefined;
            websites?: string[] | undefined;
            catalogs?: string[] | undefined;
        };
        mintable: boolean;
        total_supply: bigint;
        verification: "whitelist" | "blacklist" | "none";
        holders_count: number;
    }>;
    getJettonHolders(jettonMaster: TONAddress | string, params?: {
        limit?: number;
        offset?: number;
    }): Promise<{
        address: TONAddress;
        owner: {
            address: TONAddress;
            is_scam: boolean;
            is_wallet: boolean;
            name?: string | undefined;
            icon?: string | undefined;
        };
        balance: bigint;
    }[]>;
    getNftItemTransferHistory(item: TONAddress | string, params?: {
        before_lt?: bigint;
        limit?: number;
        start_date?: number;
        end_date?: number;
    }): Promise<{
        events: {
            lt: bigint;
            is_scam: boolean;
            event_id: string;
            account: {
                address: TONAddress;
                is_scam: boolean;
                is_wallet: boolean;
                name?: string | undefined;
                icon?: string | undefined;
            };
            timestamp: number;
            actions: {
                nft: TONAddress;
                sender?: {
                    address: TONAddress;
                    is_scam: boolean;
                    is_wallet: boolean;
                    name?: string | undefined;
                    icon?: string | undefined;
                } | undefined;
                recipient?: {
                    address: TONAddress;
                    is_scam: boolean;
                    is_wallet: boolean;
                    name?: string | undefined;
                    icon?: string | undefined;
                } | undefined;
                comment?: string | undefined;
                encrypted_comment?: {
                    encryption_type: string;
                    cipher_text: Buffer;
                } | undefined;
                payload?: Buffer | undefined;
                refund?: {
                    type: string;
                    origin: TONAddress;
                } | undefined;
                status: "ok" | "failed";
            }[];
            in_progress: boolean;
        }[];
        next_from: bigint;
    }>;
    getAccountNfts(account: TONAddress | string, params?: {
        collection?: TONAddress | string;
        limit?: number;
        offset?: number;
        indirect_ownership?: boolean;
    }): Promise<{
        address: TONAddress;
        metadata: Record<string, any>;
        approved_by: string[];
        index: bigint;
        verified: boolean;
        owner?: {
            address: TONAddress;
            is_scam: boolean;
            is_wallet: boolean;
            name?: string | undefined;
            icon?: string | undefined;
        } | undefined;
        collection?: {
            address: TONAddress;
            name: string;
            description: string;
        } | undefined;
        sale?: {
            address: TONAddress;
            market: {
                address: TONAddress;
                is_scam: boolean;
                is_wallet: boolean;
                name?: string | undefined;
                icon?: string | undefined;
            };
            price: {
                value: bigint;
                token_name: string;
            };
            owner?: {
                address: TONAddress;
                is_scam: boolean;
                is_wallet: boolean;
                name?: string | undefined;
                icon?: string | undefined;
            } | undefined;
        } | undefined;
        previews?: {
            resolution: string;
            url: string;
        }[] | undefined;
        dns?: string | undefined;
    }[]>;
    getAccountJettons(account: TONAddress | string, params?: {
        currencies?: string[];
    }): Promise<{
        balance: bigint;
        wallet_address: {
            address: TONAddress;
            is_scam: boolean;
            is_wallet: boolean;
            name?: string | undefined;
            icon?: string | undefined;
        };
        jetton: {
            symbol: string;
            address: TONAddress;
            name: string;
            decimals: number;
            image: string;
            verification: "whitelist" | "blacklist" | "none";
        };
        price?: {
            prices?: Record<string, number> | undefined;
            diff_24h?: Record<string, string> | undefined;
            diff_7d?: Record<string, string> | undefined;
            diff_30d?: Record<string, string> | undefined;
        } | undefined;
    }[]>;
}
