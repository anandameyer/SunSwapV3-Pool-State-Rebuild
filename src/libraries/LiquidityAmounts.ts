import { FixedPoint96 } from './FixedPoint96';
import { FullMath } from './FullMath';

/// @title Liquidity amount functions
/// @notice Provides functions for computing liquidity amounts from token amounts and prices
export class LiquidityAmounts {
    private static readonly MAX_UINT128 = (1n << 128n) - 1n;
    private static readonly MAX_UINT160 = (1n << 160n) - 1n;

    /// @notice Validates that a value is a proper 128-bit unsigned integer
    private static validateUint128(value: bigint, name: string): void {
        if (value < 0n || value > this.MAX_UINT128) {
            throw new Error(`LiquidityAmounts: ${name} must be a uint128`);
        }
    }

    /// @notice Validates that a value is a proper 160-bit unsigned integer
    private static validateUint160(value: bigint, name: string): void {
        if (value < 0n || value > this.MAX_UINT160) {
            throw new Error(`LiquidityAmounts: ${name} must be a uint160`);
        }
    }

    /// @notice Downcasts bigint to uint128 equivalent
    /// @param x The value to be downcasted
    /// @return y The passed value, downcasted to uint128 range
    private static toUint128(x: bigint): bigint {
        this.validateUint128(x, 'value');
        return x;
    }

    /// @notice Computes the amount of liquidity received for a given amount of token0 and price range
    /// @dev Calculates amount0 * (sqrt(upper) * sqrt(lower)) / (sqrt(upper) - sqrt(lower))
    /// @param sqrtRatioAX96 A sqrt price representing the first tick boundary
    /// @param sqrtRatioBX96 A sqrt price representing the second tick boundary
    /// @param amount0 The amount0 being sent in
    /// @return liquidity The amount of returned liquidity
    static getLiquidityForAmount0(
        sqrtRatioAX96: bigint,
        sqrtRatioBX96: bigint,
        amount0: bigint
    ): bigint {
        this.validateUint160(sqrtRatioAX96, 'sqrtRatioAX96');
        this.validateUint160(sqrtRatioBX96, 'sqrtRatioBX96');

        if (sqrtRatioAX96 > sqrtRatioBX96) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }

        const intermediate = FullMath.mulDiv(sqrtRatioAX96, sqrtRatioBX96, FixedPoint96.Q96);
        const liquidity = FullMath.mulDiv(amount0, intermediate, sqrtRatioBX96 - sqrtRatioAX96);

        return this.toUint128(liquidity);
    }

    /// @notice Computes the amount of liquidity received for a given amount of token1 and price range
    /// @dev Calculates amount1 / (sqrt(upper) - sqrt(lower))
    /// @param sqrtRatioAX96 A sqrt price representing the first tick boundary
    /// @param sqrtRatioBX96 A sqrt price representing the second tick boundary
    /// @param amount1 The amount1 being sent in
    /// @return liquidity The amount of returned liquidity
    static getLiquidityForAmount1(
        sqrtRatioAX96: bigint,
        sqrtRatioBX96: bigint,
        amount1: bigint
    ): bigint {
        this.validateUint160(sqrtRatioAX96, 'sqrtRatioAX96');
        this.validateUint160(sqrtRatioBX96, 'sqrtRatioBX96');

        if (sqrtRatioAX96 > sqrtRatioBX96) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }

        const liquidity = FullMath.mulDiv(amount1, FixedPoint96.Q96, sqrtRatioBX96 - sqrtRatioAX96);
        return this.toUint128(liquidity);
    }

    /// @notice Computes the maximum amount of liquidity received for given amounts of token0 and token1
    /// @param sqrtRatioX96 A sqrt price representing the current pool prices
    /// @param sqrtRatioAX96 A sqrt price representing the first tick boundary
    /// @param sqrtRatioBX96 A sqrt price representing the second tick boundary
    /// @param amount0 The amount of token0 being sent in
    /// @param amount1 The amount of token1 being sent in
    /// @return liquidity The maximum amount of liquidity received
    static getLiquidityForAmounts(
        sqrtRatioX96: bigint,
        sqrtRatioAX96: bigint,
        sqrtRatioBX96: bigint,
        amount0: bigint,
        amount1: bigint
    ): bigint {
        // console.log({ name: "getLiquidityForAmounts start", sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, amount0, amount1 });

        this.validateUint160(sqrtRatioX96, 'sqrtRatioX96');
        this.validateUint160(sqrtRatioAX96, 'sqrtRatioAX96');
        this.validateUint160(sqrtRatioBX96, 'sqrtRatioBX96');

        if (sqrtRatioAX96 > sqrtRatioBX96) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }

        let result: bigint;

        if (sqrtRatioX96 <= sqrtRatioAX96) {
            result = this.getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0);
        } else if (sqrtRatioX96 < sqrtRatioBX96) {
            const liquidity0 = this.getLiquidityForAmount0(sqrtRatioX96, sqrtRatioBX96, amount0);
            const liquidity1 = this.getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioX96, amount1);
            result = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
        } else {
            result = this.getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1);
        }

        // console.log({ name: "getLiquidityForAmounts end", sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, amount0, amount1, result });

        return result;
    }

    /// @notice Computes the amount of token0 for a given amount of liquidity and a price range
    /// @param sqrtRatioAX96 A sqrt price representing the first tick boundary
    /// @param sqrtRatioBX96 A sqrt price representing the second tick boundary
    /// @param liquidity The liquidity being valued
    /// @return amount0 The amount of token0
    static getAmount0ForLiquidity(
        sqrtRatioAX96: bigint,
        sqrtRatioBX96: bigint,
        liquidity: bigint
    ): bigint {
        this.validateUint160(sqrtRatioAX96, 'sqrtRatioAX96');
        this.validateUint160(sqrtRatioBX96, 'sqrtRatioBX96');
        this.validateUint128(liquidity, 'liquidity');

        if (sqrtRatioAX96 > sqrtRatioBX96) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }

        return FullMath.mulDiv(
            liquidity << BigInt(FixedPoint96.RESOLUTION),
            sqrtRatioBX96 - sqrtRatioAX96,
            sqrtRatioBX96
        ) / sqrtRatioAX96;
    }

    /// @notice Computes the amount of token1 for a given amount of liquidity and a price range
    /// @param sqrtRatioAX96 A sqrt price representing the first tick boundary
    /// @param sqrtRatioBX96 A sqrt price representing the second tick boundary
    /// @param liquidity The liquidity being valued
    /// @return amount1 The amount of token1
    static getAmount1ForLiquidity(
        sqrtRatioAX96: bigint,
        sqrtRatioBX96: bigint,
        liquidity: bigint
    ): bigint {
        this.validateUint160(sqrtRatioAX96, 'sqrtRatioAX96');
        this.validateUint160(sqrtRatioBX96, 'sqrtRatioBX96');
        this.validateUint128(liquidity, 'liquidity');

        if (sqrtRatioAX96 > sqrtRatioBX96) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }

        return FullMath.mulDiv(liquidity, sqrtRatioBX96 - sqrtRatioAX96, FixedPoint96.Q96);
    }

    /// @notice Computes the token0 and token1 value for a given amount of liquidity
    /// @param sqrtRatioX96 A sqrt price representing the current pool prices
    /// @param sqrtRatioAX96 A sqrt price representing the first tick boundary
    /// @param sqrtRatioBX96 A sqrt price representing the second tick boundary
    /// @param liquidity The liquidity being valued
    /// @return amount0 The amount of token0
    /// @return amount1 The amount of token1
    static getAmountsForLiquidity(
        sqrtRatioX96: bigint,
        sqrtRatioAX96: bigint,
        sqrtRatioBX96: bigint,
        liquidity: bigint
    ): [bigint, bigint] {
        this.validateUint160(sqrtRatioX96, 'sqrtRatioX96');
        this.validateUint160(sqrtRatioAX96, 'sqrtRatioAX96');
        this.validateUint160(sqrtRatioBX96, 'sqrtRatioBX96');
        this.validateUint128(liquidity, 'liquidity');

        if (sqrtRatioAX96 > sqrtRatioBX96) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }

        let amount0: bigint = 0n;
        let amount1: bigint = 0n;

        if (sqrtRatioX96 <= sqrtRatioAX96) {
            amount0 = this.getAmount0ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
        } else if (sqrtRatioX96 < sqrtRatioBX96) {
            amount0 = this.getAmount0ForLiquidity(sqrtRatioX96, sqrtRatioBX96, liquidity);
            amount1 = this.getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioX96, liquidity);
        } else {
            amount1 = this.getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
        }

        return [amount0, amount1];
    }
}