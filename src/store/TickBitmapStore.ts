import { Store } from "@subsquid/typeorm-store";
import { BitMath } from "../libraries/BitMath";
import { TickBitmap } from "../model";


export class TickBitmapStore {
    private readonly store: Store;

    constructor(store: Store) {
        this.store = store;
    }

    /**
     * Flips the initialized state for a given tick
     * @param tick The tick to flip (number)
     * @param tickSpacing The spacing between usable ticks (number)
     */
    async flipTick(
        poolId: string,
        tick: number,
        tickSpacing: number
    ): Promise<void> {
        if (tick % tickSpacing !== 0) {
            throw new Error('Tick not spaced correctly');
        }

        const [wordPos, bitPos] = position(tick / tickSpacing);
        const mask = 1n << BigInt(bitPos);
        const stored = await this.store.findOneBy(TickBitmap, { id: `${poolId}-${wordPos}` });
        // console.log("tickbitmap before", stored);
        const current = stored ? stored.value : 0n;
        const updated = new TickBitmap({ id: `${poolId}-${wordPos}`, poolId, tick, tickSpacing, value: current ^ mask })
        // console.log("tickbitmap after", updated);
        await this.store.upsert(updated);
    }

    /**
     * Finds the next initialized tick within one word
     * @param tick The starting tick (number)
     * @param tickSpacing The spacing between usable ticks (number)
     * @param lte Whether to search left (true) or right (false)
     * @returns [nextTick, initialized] tuple
     */
    async nextInitializedTickWithinOneWord(
        poolId: string,
        tick: number,
        tickSpacing: number,
        lte: boolean
    ): Promise<[number, boolean]> {
        let compressed = Math.floor(tick / tickSpacing);
        if (tick < 0 && tick % tickSpacing !== 0) {
            compressed--; // round towards negative infinity
        }

        if (lte) {
            const [wordPos, bitPos] = position(compressed);
            const mask = ((1n << BigInt(bitPos)) - 1n + (1n << BigInt(bitPos)));
            const stored = await this.store.findOneBy(TickBitmap, { id: `${poolId}-${wordPos}` });
            const word = stored ? stored.value : 0n;
            const masked = word & mask;

            const initialized = masked !== 0n;
            const mostSignificantBit = initialized ? BitMath.mostSignificantBit(masked) : 0;
            const next = initialized
                ? (compressed - (bitPos - mostSignificantBit)) * tickSpacing
                : (compressed - bitPos) * tickSpacing;

            return [next, initialized];
        }

        const [wordPos, bitPos] = position(compressed + 1);
        const mask = ~((1n << BigInt(bitPos)) - 1n);
        const stored = await this.store.findOneBy(TickBitmap, { id: `${poolId}-${wordPos}` });
        const word = stored ? stored.value : 0n;
        const masked = word & mask;

        const initialized = masked !== 0n;
        const leastSignificantBit = initialized ? BitMath.leastSignificantBit(masked) : 255;
        const next = initialized
            ? (compressed + 1 + (leastSignificantBit - bitPos)) * tickSpacing
            : (compressed + 1 + (255 - bitPos)) * tickSpacing;

        return [next, initialized];
    }

}

/**
* Computes the position in the mapping where the initialized bit for a tick lives
* @param tick The tick for which to compute the position (as number)
* @returns [wordPos, bitPos] tuple (both as number)
*/
function position(tick: number): [number, number] {
    const wordPos = tick >> 8; // int16 (tick is int24)
    const bitPos = tick % 256; // uint8
    return [wordPos, bitPos];
}