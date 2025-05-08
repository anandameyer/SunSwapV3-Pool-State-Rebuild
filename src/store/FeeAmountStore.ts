import { Store } from "@subsquid/typeorm-store";
import { FeeAmount } from "../model";

const defaultFeeAmount = [
    [500, 10],
    [3000, 60],
    [10000, 200],
]

export class FeeAmountStore {
    private readonly store: Store;

    constructor(store: Store) {
        this.store = store;
    }

    async get(fee: number): Promise<FeeAmount | undefined> {
        return await this.store.findOneBy(FeeAmount, { id: fee.toString() });
    }

    async ensureDefault(): Promise<void> {
        // const defaults: FeeAmount[] = [];
        for (let [fee, tickSpacing] of defaultFeeAmount) {
            const stored = await this.get(fee);
            if (!stored) {
                await this.save(new FeeAmount({ id: fee.toString(), fee, tickSpacing }));
                // defaults.push({ id: fee.toString(), fee, tickSpacing } as FeeAmount);
            }
        }
        // await this.store.upsert(defaults);
    }

    async save(data: FeeAmount): Promise<void> {
        await this.store.upsert(data);
    }
}