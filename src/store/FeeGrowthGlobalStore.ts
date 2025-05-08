import { Store } from "@subsquid/typeorm-store";
import { FeeGrowthGlobal } from "../model";

export class FeeGrowthGlobalStore {
    private readonly store: Store;

    constructor(store: Store) {
        this.store = store;
    }

    async get(poolId: string): Promise<FeeGrowthGlobal> {
        let fee = await this.store.findOne(FeeGrowthGlobal, { where: { poolId }, order: { revision: "desc" } });
        if (!fee) {
            fee = new FeeGrowthGlobal({
                id: `${poolId}-0`,
                revision: 0,
                poolId: poolId,
                blockNumber: 0,
                timestamp: 0,
                feeGrowthGlobal0X128: 0n,
                feeGrowthGlobal1X128: 0n
            })
            await this.store.upsert(fee)
        }
        return fee;
    }

    async save(data: FeeGrowthGlobal, blockNumber: number, blockTimestamp: number): Promise<void> {
        console.dir(["save", data, { blockNumber, blockTimestamp }], { depth: null });
        const newData = new FeeGrowthGlobal({
            id: `${data.poolId}-${data.revision + 1}`,
            revision: data.revision + 1,
            poolId: data.poolId,
            blockNumber: blockNumber,
            timestamp: blockTimestamp,
            feeGrowthGlobal0X128: data.feeGrowthGlobal0X128,
            feeGrowthGlobal1X128: data.feeGrowthGlobal1X128
        });

        console.dir(["save.newData", newData], { depth: null });

        await this.store.upsert(newData);
    }
}