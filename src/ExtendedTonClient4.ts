import { Address, Cell, Contract, TonClient4, openContract } from "@ton/ton";
import { ExtendedContractProvider } from "./ExtendedContractProvider";
import { ExtendedOpenedContract } from "./api";

export class ExtendedTonClient4 extends TonClient4 {
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
