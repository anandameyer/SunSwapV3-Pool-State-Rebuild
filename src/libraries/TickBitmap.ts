import { BitMath } from './BitMath';

export class TickBitmap {
    /**
     * Computes the position in the mapping where the initialized bit for a tick lives
     * @param tick The tick for which to compute the position (as number)
     * @returns [wordPos, bitPos] tuple (both as number)
     */
    private static position(tick: number): [number, number] {
        const wordPos = tick >> 8; // int16 (tick is int24)
        const bitPos = tick % 256; // uint8
        return [wordPos, bitPos];
    }

    /**
     * Flips the initialized state for a given tick
     * @param self The mapping of word positions to bitmaps (Map<number, bigint>)
     * @param tick The tick to flip (number)
     * @param tickSpacing The spacing between usable ticks (number)
     */
    static flipTick(
        self: Map<number, bigint>,
        tick: number,
        tickSpacing: number
    ): void {
        if (tick % tickSpacing !== 0) {
            throw new Error('Tick not spaced correctly');
        }

        const [wordPos, bitPos] = this.position(tick / tickSpacing);
        const mask = 1n << BigInt(bitPos);
        const current = self.get(wordPos) ?? 0n;
        self.set(wordPos, current ^ mask);
    }

    /**
     * Finds the next initialized tick within one word
     * @param self The mapping of word positions to bitmaps (Map<number, bigint>)
     * @param tick The starting tick (number)
     * @param tickSpacing The spacing between usable ticks (number)
     * @param lte Whether to search left (true) or right (false)
     * @returns [nextTick, initialized] tuple
     */
    static nextInitializedTickWithinOneWord(
        self: Map<number, bigint>,
        tick: number,
        tickSpacing: number,
        lte: boolean
    ): [number, boolean] {
        let compressed = Math.floor(tick / tickSpacing);
        if (tick < 0 && tick % tickSpacing !== 0) {
            compressed--; // round towards negative infinity
        }

        if (lte) {
            const [wordPos, bitPos] = this.position(compressed);
            const mask = ((1n << BigInt(bitPos)) - 1n + (1n << BigInt(bitPos)))
            const word = self.get(wordPos) ?? 0n;
            const masked = word & mask;

            const initialized = masked !== 0n;
            const mostSignificantBit = initialized ? BitMath.mostSignificantBit(masked) : 0;
            const next = initialized
                ? (compressed - (bitPos - mostSignificantBit)) * tickSpacing
                : (compressed - bitPos) * tickSpacing;

            return [next, initialized];
        } else {
            const [wordPos, bitPos] = this.position(compressed + 1);
            const mask = ~((1n << BigInt(bitPos)) - 1n);
            const word = self.get(wordPos) ?? 0n;
            const masked = word & mask;

            const initialized = masked !== 0n;
            const leastSignificantBit = initialized ? BitMath.leastSignificantBit(masked) : 255;
            const next = initialized
                ? (compressed + 1 + (leastSignificantBit - bitPos)) * tickSpacing
                : (compressed + 1 + (255 - bitPos)) * tickSpacing;

            return [next, initialized];
        }
    }
}