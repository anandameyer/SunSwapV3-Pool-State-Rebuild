/**
 * @title Safe casting methods
 * @notice Contains methods for safely casting between types
 */
export class SafeCast {
    /**
     * Cast a bigint to a number (uint160 equivalent), revert on overflow
     * @param y The bigint to be downcasted
     * @returns The downcasted number
     */
    static toUint160(y: bigint): bigint {
        // const z = Number(y);
        const z = BigInt.asIntN(160, y);
        // if (BigInt(z) !== y) {
        if (z !== y) {
            throw new Error('SafeCast: value doesn\'t fit in 160 bits');
        }
        return z;
    }

    /**
     * Cast a bigint to a number (int128 equivalent), revert on overflow or underflow
     * @param y The bigint to be downcasted
     * @returns The downcasted number
     */
    static toInt128(y: bigint): bigint {
        // const z = Number(y);
        const z = BigInt.asIntN(128, y);
        // if (BigInt(z) !== y) {
        if (z !== y) {
            throw new Error('SafeCast: value doesn\'t fit in 128 bits');
        }
        return z;
    }

    /**
     * Cast a bigint to a bigint (int256 equivalent), revert on overflow
     * @param y The bigint to be casted
     * @returns The casted bigint
     */
    static toInt256(y: bigint): bigint {
        if (y >= 2n ** 255n) {
            throw new Error('SafeCast: value doesn\'t fit in int256');
        }
        return y;
    }
}