import { FullMath } from './FullMath';
import { SqrtPriceMath } from './SqrtPriceMath';

export class SwapMath {
    static computeSwapStep(
        sqrtRatioCurrentX96: bigint,
        sqrtRatioTargetX96: bigint,
        liquidity: bigint,
        amountRemaining: bigint,
        feePips: bigint // Changed from number to bigint
    ): [bigint, bigint, bigint, bigint] {
        const zeroForOne = sqrtRatioCurrentX96 >= sqrtRatioTargetX96;
        const exactIn = amountRemaining >= 0n;
        const feeDenominator = 1000000n;

        let sqrtRatioNextX96: bigint;
        let amountIn: bigint;
        let amountOut: bigint;
        let feeAmount: bigint;

        if (exactIn) {
            const amountRemainingLessFee = FullMath.mulDiv(
                amountRemaining,
                feeDenominator - feePips,
                feeDenominator
            );

            const amountInInitial = zeroForOne
                ? SqrtPriceMath.getAmount0Delta(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, true)
                : SqrtPriceMath.getAmount1Delta(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, true);

            if (amountRemainingLessFee >= amountInInitial) {
                sqrtRatioNextX96 = sqrtRatioTargetX96;
                amountIn = amountInInitial;
            } else {
                sqrtRatioNextX96 = SqrtPriceMath.getNextSqrtPriceFromInput(
                    sqrtRatioCurrentX96,
                    liquidity,
                    amountRemainingLessFee,
                    zeroForOne
                );
                amountIn = zeroForOne
                    ? SqrtPriceMath.getAmount0Delta(sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, true)
                    : SqrtPriceMath.getAmount1Delta(sqrtRatioCurrentX96, sqrtRatioNextX96, liquidity, true);
            }

            amountOut = zeroForOne
                ? SqrtPriceMath.getAmount1Delta(sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, false)
                : SqrtPriceMath.getAmount0Delta(sqrtRatioCurrentX96, sqrtRatioNextX96, liquidity, false);
        } else {
            const amountRemainingAbs = -amountRemaining;
            amountOut = zeroForOne
                ? SqrtPriceMath.getAmount1Delta(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, false)
                : SqrtPriceMath.getAmount0Delta(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, false);

            if (amountRemainingAbs >= amountOut) {
                sqrtRatioNextX96 = sqrtRatioTargetX96;
            } else {
                sqrtRatioNextX96 = SqrtPriceMath.getNextSqrtPriceFromOutput(
                    sqrtRatioCurrentX96,
                    liquidity,
                    amountRemainingAbs,
                    zeroForOne
                );
                amountOut = zeroForOne
                    ? SqrtPriceMath.getAmount1Delta(sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, false)
                    : SqrtPriceMath.getAmount0Delta(sqrtRatioCurrentX96, sqrtRatioNextX96, liquidity, false);
            }

            amountIn = zeroForOne
                ? SqrtPriceMath.getAmount0Delta(sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, true)
                : SqrtPriceMath.getAmount1Delta(sqrtRatioCurrentX96, sqrtRatioNextX96, liquidity, true);
        }

        // Cap output amount for exactOut case
        if (!exactIn && amountOut > -amountRemaining) {
            amountOut = -amountRemaining;
        }

        // Calculate fee
        if (exactIn && sqrtRatioNextX96 !== sqrtRatioTargetX96) {
            feeAmount = amountRemaining - amountIn;
        } else {
            feeAmount = FullMath.mulDivRoundingUp(amountIn, feePips, feeDenominator - feePips);
        }

        return [sqrtRatioNextX96, amountIn, amountOut, feeAmount];
    }
}