import { Store } from "@subsquid/typeorm-store";
import { Slot } from "../model";

export class SlotStore {
    private readonly store: Store

    constructor(store: Store) {
        this.store = store;
    }

    async get(id: string): Promise<Slot | undefined> {
        return await this.store.findOneBy(Slot, { id });
    }

    async save(slot: Slot): Promise<void> {
        console.dir(["slot save", slot], { depth: null });
        await this.store.upsert(slot);
    }
}

export function emptySlot(id: string): Slot {
    return new Slot({
        id: id,
        sqrtPriceX96: 0n,
        tick: 0,
        observationIndex: 0,
        observationCardinality: 0,
        observationCardinalityNext: 0,
        feeProtocol: 0,
        unlocked: false
    });
}