import { FullMath } from './FullMath';
import { UnsafeMath } from './UnsafeMath';

/// @title Functions based on Q64.96 sqrt price and liquidity
export class SqrtPriceMath {
    static readonly Q96 = 2n ** 96n;
    static readonly RESOLUTION = 96n;
    static readonly MAX_UINT160 = (1n << 160n) - 1n;
    static readonly MAX_UINT128 = (1n << 128n) - 1n;

    private static validateUint160(value: bigint, name: string): void {
        if (value < 0n || value > this.MAX_UINT160) {
            throw new Error(`SqrtPriceMath: ${name} must be a uint160`);
        }
    }

    private static validateUint128(value: bigint, name: string): void {
        if (value < 0n || value > this.MAX_UINT128) {
            throw new Error(`SqrtPriceMath: ${name} must be a uint128`);
        }
    }

    private static toUint160(value: bigint): bigint {
        this.validateUint160(value, 'value');
        return value;
    }

    /// @notice Gets the next sqrt price given a delta of token0
    static getNextSqrtPriceFromAmount0RoundingUp(
        sqrtPX96: bigint,
        liquidity: bigint,
        amount: bigint,
        add: boolean
    ): bigint {
        this.validateUint160(sqrtPX96, 'sqrtPX96');
        this.validateUint128(liquidity, 'liquidity');

        if (amount === 0n) return sqrtPX96;
        const numerator1 = liquidity << this.RESOLUTION;

        if (add) {
            let product: bigint;
            if ((product = amount * sqrtPX96) / amount === sqrtPX96) {
                const denominator = numerator1 + product;
                if (denominator >= numerator1) {
                    return this.toUint160(FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator));
                }
            }
            return this.toUint160(UnsafeMath.divRoundingUp(numerator1, (numerator1 / sqrtPX96) + amount));
        } else {
            let product: bigint;
            if (!((product = amount * sqrtPX96) / amount === sqrtPX96 && numerator1 > product)) {
                throw new Error('SqrtPriceMath: product overflow or numerator1 <= product');
            }
            const denominator = numerator1 - product;
            return this.toUint160(FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator));
        }
    }

    /// @notice Gets the next sqrt price given a delta of token1
    static getNextSqrtPriceFromAmount1RoundingDown(
        sqrtPX96: bigint,
        liquidity: bigint,
        amount: bigint,
        add: boolean
    ): bigint {
        this.validateUint160(sqrtPX96, 'sqrtPX96');
        this.validateUint128(liquidity, 'liquidity');

        if (add) {
            let quotient: bigint;
            if (amount <= this.MAX_UINT160) {
                quotient = (amount << this.RESOLUTION) / liquidity;
            } else {
                quotient = FullMath.mulDiv(amount, this.Q96, liquidity);
            }
            return this.toUint160(sqrtPX96 + quotient);
        } else {
            let quotient: bigint;
            if (amount <= this.MAX_UINT160) {
                quotient = UnsafeMath.divRoundingUp(amount << this.RESOLUTION, liquidity);
            } else {
                quotient = FullMath.mulDivRoundingUp(amount, this.Q96, liquidity);
            }
            if (sqrtPX96 <= quotient) {
                throw new Error('SqrtPriceMath: sqrtPX96 <= quotient');
            }
            return this.toUint160(sqrtPX96 - quotient);
        }
    }

    /// @notice Gets the next sqrt price given an input amount of token0 or token1
    static getNextSqrtPriceFromInput(
        sqrtPX96: bigint,
        liquidity: bigint,
        amountIn: bigint,
        zeroForOne: boolean
    ): bigint {
        this.validateUint160(sqrtPX96, 'sqrtPX96');
        this.validateUint128(liquidity, 'liquidity');

        if (sqrtPX96 === 0n) throw new Error('SqrtPriceMath: sqrtPX96 cannot be 0');
        if (liquidity === 0n) throw new Error('SqrtPriceMath: liquidity cannot be 0');

        const result = zeroForOne
            ? this.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
            : this.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true);

        this.validateUint160(result, 'result');
        return result;
    }

    /// @notice Gets the next sqrt price given an output amount of token0 or token1
    static getNextSqrtPriceFromOutput(
        sqrtPX96: bigint,
        liquidity: bigint,
        amountOut: bigint,
        zeroForOne: boolean
    ): bigint {
        this.validateUint160(sqrtPX96, 'sqrtPX96');
        this.validateUint128(liquidity, 'liquidity');

        if (sqrtPX96 === 0n) throw new Error('SqrtPriceMath: sqrtPX96 cannot be 0');
        if (liquidity === 0n) throw new Error('SqrtPriceMath: liquidity cannot be 0');

        const result = zeroForOne
            ? this.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountOut, false)
            : this.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountOut, false);

        this.validateUint160(result, 'result');
        return result;
    }

    /// @notice Gets the amount0 delta between two prices
    static getAmount0Delta(
        sqrtRatioAX96: bigint,
        sqrtRatioBX96: bigint,
        liquidity: bigint,
        roundUp: boolean
    ): bigint {

        this.validateUint160(sqrtRatioAX96, 'sqrtRatioAX96');
        this.validateUint160(sqrtRatioBX96, 'sqrtRatioBX96');
        this.validateUint128(liquidity, 'liquidity');

        if (sqrtRatioAX96 > sqrtRatioBX96) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }

        const numerator1 = liquidity << this.RESOLUTION;
        const numerator2 = sqrtRatioBX96 - sqrtRatioAX96;

        if (sqrtRatioAX96 === 0n) {
            throw new Error('SqrtPriceMath: sqrtRatioAX96 cannot be 0');
        }

        const result = roundUp
            ? UnsafeMath.divRoundingUp(
                FullMath.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96),
                sqrtRatioAX96
            )
            : FullMath.mulDiv(numerator1, numerator2, sqrtRatioBX96) / sqrtRatioAX96;

        // console.log("getAmount0Delta", { sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp, result });
        return result;
    }

    /// @notice Gets the amount1 delta between two prices
    static getAmount1Delta(
        sqrtRatioAX96: bigint,
        sqrtRatioBX96: bigint,
        liquidity: bigint,
        roundUp: boolean
    ): bigint {
        this.validateUint160(sqrtRatioAX96, 'sqrtRatioAX96');
        this.validateUint160(sqrtRatioBX96, 'sqrtRatioBX96');
        this.validateUint128(liquidity, 'liquidity');

        if (sqrtRatioAX96 > sqrtRatioBX96) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }

        return roundUp
            ? FullMath.mulDivRoundingUp(liquidity, sqrtRatioBX96 - sqrtRatioAX96, this.Q96)
            : FullMath.mulDiv(liquidity, sqrtRatioBX96 - sqrtRatioAX96, this.Q96);
    }

    /// @notice Helper that gets signed token0 delta (matches EVM behavior exactly)
    static getAmount0DeltaSigned(
        sqrtRatioAX96: bigint,
        sqrtRatioBX96: bigint,
        liquidity: bigint
    ): bigint {
        // Direct calculation without range checks to match EVM behavior
        const result = liquidity < 0n
            ? -this.getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, -liquidity, false)
            : this.getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, true);
        // console.log({ name: "getAmount0DeltaSigned", sqrtRatioAX96, sqrtRatioBX96, liquidity, result });
        return result
    }

    /// @notice Helper that gets signed token1 delta
    static getAmount1DeltaSigned(
        sqrtRatioAX96: bigint,
        sqrtRatioBX96: bigint,
        liquidity: bigint
    ): bigint {
        const result = liquidity < 0n
            ? -this.getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, -liquidity, false)
            : this.getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, true);
        // console.log({ name: "getAmount1DeltaSigned", sqrtRatioAX96, sqrtRatioBX96, liquidity, result });
        return result
    }
}