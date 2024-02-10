import {Address, Cell, Contract, openContract, TonClient4} from "@ton/ton";
import {ExtendedContractProvider} from "./ExtendedContractProvider";
import {API, ExtendedOpenedContract} from "./api";

/**
 * Extended contract provider
 * @deprecated use `TonClient4` instead, will be removed when @ton/ton will be updated
 */
export class ExtendedTonClient4 extends TonClient4 implements API {
    openExtended<T extends Contract>(contract: T): ExtendedOpenedContract<T> {
        return openContract(contract, (args) => this.provider(args.address, args.init)) as any;
    }

    provider(address: Address, init?: { code: Cell; data: Cell; } | null | undefined): ExtendedContractProvider {
        return {
            ...super.provider(address, init),
            reopen: (contract) => {
                return this.openExtended(contract);
            }
        }
    }
}
