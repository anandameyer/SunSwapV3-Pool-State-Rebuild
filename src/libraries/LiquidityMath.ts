/// @title Math library for liquidity
export class LiquidityMath {
    private static readonly MAX_UINT128 = (1n << 128n) - 1n;
    private static readonly MIN_INT128 = -(1n << 127n);
    private static readonly MAX_INT128 = (1n << 127n) - 1n;

    /// @notice Validates that a value is a proper 128-bit unsigned integer
    private static validateUint128(value: bigint, name: string): void {
        if (value < 0n || value > this.MAX_UINT128) {
            throw new Error(`LiquidityMath: ${name} must be a uint128`);
        }
    }

    /// @notice Validates that a value is a proper 128-bit signed integer
    private static validateInt128(value: bigint, name: string): void {
        if (value < this.MIN_INT128 || value > this.MAX_INT128) {
            throw new Error(`LiquidityMath: ${name} must be an int128`);
        }
    }

    /// @notice Add a signed liquidity delta to liquidity and throw if it overflows or underflows
    /// @param x The liquidity before change (uint128)
    /// @param y The delta by which liquidity should be changed (int128)
    /// @return z The liquidity delta (uint128)
    static addDelta(x: bigint, y: bigint): bigint {
        // Validate input types
        this.validateUint128(x, 'x');
        this.validateInt128(y, 'y');

        let z: bigint;
        if (y < 0n) {
            z = x - BigInt.asUintN(128, -y);
            // Check for underflow (z must be less than original x when subtracting)
            if (z >= x) {
                throw new Error('LiquidityMath: Liquidity subtraction overflow (LS)');
            }
        } else {
            z = x + BigInt.asUintN(128, y);
            // Check for overflow (z must be >= original x when adding)
            if (z < x) {
                throw new Error('LiquidityMath: Liquidity addition overflow (LA)');
            }
        }

        // console.log({ name: "addDelta", x, y, z });

        // Validate output is within uint128 range
        this.validateUint128(z, 'result');
        return z;
    }
}