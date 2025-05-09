import { Store } from "@subsquid/typeorm-store";
import { Pool } from "../model";

export class PoolStore {
    private readonly store: Store;

    constructor(store: Store) {
        this.store = store;
    }

    // async getByKey(token0: string, token1: string, fee: number): Promise<Pool | undefined> {
    //     return await this.store.findOneBy(Pool, { token0: token0, token1: token1, fee: fee });
    // }

    async getById(id: string): Promise<Pool | undefined> {
        return this.store.findOneBy(Pool, { id });

        // return await this.store.findOneBy(Pool, { id });
    }

    async save(config: Pool): Promise<void> {
        // console.dir(["pool save", config], { depth: null });
        await this.store.upsert(config);
    }

    async allPool(): Promise<Pool[]> {
        return await this.store.find(Pool);
    }
}

// function empty(): Pool {
//     return {
//         id: '0',
//         protocol_fee_token0: 0n,
//         owner: '',
//         protocol_fee_token1: 0n,
//         factory: '',
//         token0: '',
//         token1: '',
//         fee: 0,
//         tickSpacing: 0,
//         maxLiquidityPerTick: 0n,
//         liquidity: 0n
//     }
// }