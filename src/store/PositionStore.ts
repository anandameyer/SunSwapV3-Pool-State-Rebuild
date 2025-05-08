import { Store } from "@subsquid/typeorm-store";
import { Position } from "../model";


export class PositionStore {
    private readonly store: Store;

    constructor(store: Store) {
        this.store = store;
    }

    async getByTokenId(tokenId: bigint): Promise<Position | undefined> {
        return await this.store.findOne(Position, { where: { tokenId, burned: false } });
    }

    async getById(id: string): Promise<Position | undefined> {
        return await this.store.findOne(Position, { where: { id, burned: false } });
    }

    async getByPoolId(poolId: string): Promise<Position | undefined> {
        return await this.store.findOne(Position, { where: { poolId, burned: false } });
    }

    async burn(tokenId: bigint): Promise<void> {
        const position = await this.getByTokenId(tokenId);
        if (position) {
            position.burned = true;
            await this.store.upsert(position);
        }
    }

    async save(self: Position) {
        console.dir(["position save", self], { depth: null });
        await this.store.upsert(self);
    }
}