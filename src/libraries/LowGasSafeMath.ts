/**
 * @title Optimized overflow and underflow safe math operations
 * @notice Contains methods for doing math operations that revert on overflow or underflow
 */
export class LowGasSafeMath {
    /**
     * Returns x + y, reverts if sum overflows uint256
     * @param x The augend
     * @param y The addend
     * @returns z The sum of x and y
     */
    static add(x: bigint, y: bigint): bigint {
        const z = x + y;
        if (z < x) {
            throw new Error('LowGasSafeMath: addition overflow');
        }
        return z;
    }

    /**
     * Returns x - y, reverts if underflows
     * @param x The minuend
     * @param y The subtrahend
     * @returns z The difference of x and y
     */
    static sub(x: bigint, y: bigint): bigint {
        const z = x - y;
        if (z > x) {
            throw new Error('LowGasSafeMath: subtraction underflow');
        }
        return z;
    }

    /**
     * Returns x * y, reverts if overflows
     * @param x The multiplicand
     * @param y The multiplier
     * @returns z The product of x and y
     */
    static mul(x: bigint, y: bigint): bigint {
        if (x === 0n) return 0n;
        
        const z = x * y;
        if (z / x !== y) {
            throw new Error('LowGasSafeMath: multiplication overflow');
        }
        return z;
    }

    /**
     * Returns x + y, reverts if overflows or underflows
     * @param x The augend
     * @param y The addend
     * @returns z The sum of x and y
     */
    static addInt(x: bigint, y: bigint): bigint {
        const z = x + y;
        if ((z >= x) !== (y >= 0n)) {
            throw new Error('LowGasSafeMath: signed addition overflow');
        }
        return z;
    }

    /**
     * Returns x - y, reverts if overflows or underflows
     * @param x The minuend
     * @param y The subtrahend
     * @returns z The difference of x and y
     */
    static subInt(x: bigint, y: bigint): bigint {
        const z = x - y;
        if ((z <= x) !== (y >= 0n)) {
            throw new Error('LowGasSafeMath: signed subtraction overflow');
        }
        return z;
    }
}