export class BitMath {
    /**
     * Returns the index of the most significant bit of the number
     * @param x The value for which to compute the most significant bit (as bigint)
     * @returns The index of the most significant bit (as number)
     */
    static mostSignificantBit(x: bigint): number {
        if (x <= 0n) {
            throw new Error('Input must be greater than 0');
        }

        let r = 0;

        // Define comparison values as bigint constants
        const thresholds: { value: bigint, shift: number }[] = [
            { value: 0x100000000000000000000000000000000n, shift: 128 },
            { value: 0x10000000000000000n, shift: 64 },
            { value: 0x100000000n, shift: 32 },
            { value: 0x10000n, shift: 16 },
            { value: 0x100n, shift: 8 },
            { value: 0x10n, shift: 4 },
            { value: 0x4n, shift: 2 },
            { value: 0x2n, shift: 1 }
        ];

        for (const { value, shift } of thresholds) {
            if (x >= value) {
                x >>= BigInt(shift);
                r += shift;
            }
        }

        return r;
    }

    /**
     * Returns the index of the least significant bit of the number
     * @param x The value for which to compute the least significant bit (as bigint)
     * @returns The index of the least significant bit (as number)
     */
    static leastSignificantBit(x: bigint): number {
        if (x <= 0n) {
            throw new Error('Input must be greater than 0');
        }

        let r = 255;

        // Define masks as bigint constants
        const masks: { mask: bigint, shift: number }[] = [
            { mask: BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'), shift: 128 }, // uint128.max
            { mask: 0xFFFFFFFFFFFFFFFFn, shift: 64 }, // uint64.max
            { mask: 0xFFFFFFFFn, shift: 32 }, // uint32.max
            { mask: 0xFFFFn, shift: 16 }, // uint16.max
            { mask: 0xFFn, shift: 8 }, // uint8.max
            { mask: 0xFn, shift: 4 },
            { mask: 0x3n, shift: 2 },
            { mask: 0x1n, shift: 1 }
        ];

        for (const { mask, shift } of masks) {
            if ((x & mask) !== 0n) {
                r -= shift;
            } else {
                x >>= BigInt(shift);
            }
        }

        return r;
    }
}