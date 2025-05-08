/**
 * @title Contains 512-bit math functions
 * @notice Facilitates multiplication and division that can have overflow of an intermediate value without any loss of precision
 * @dev Handles "phantom overflow" i.e., allows multiplication and division where an intermediate value overflows 256 bits
 */
export class FullMath {
    private static MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');


    /**
     * @notice Calculates floor(a×b÷denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
     * @param a The multiplicand
     * @param b The multiplier
     * @param denominator The divisor
     * @return result The 256-bit result
     * @dev Credit to Remco Bloemen under MIT license https://xn--2-umb.com/21/muldiv
     */
    static mulDiv(
        a: bigint,
        b: bigint,
        denominator: bigint
    ): bigint {
        // 1. Calculate the full 512-bit product
        const product = a * b;

        // 2. Handle the simple case where product fits in 256 bits
        if (product >> 256n === 0n) {
            if (denominator === 0n) throw new Error("Denominator cannot be zero");
            return product / denominator;
        }

        // 3. Ensure denominator is larger than the high bits of product
        if (denominator <= (product >> 256n)) {
            throw new Error("Denominator must be greater than product high bits");
        }

        // 4. Calculate remainder using native bigint modulo
        const remainder = product % denominator;

        // 5. Adjust the product by subtracting remainder
        const adjustedProduct = product - remainder;

        // console.log({ a, b, denominator, result: adjustedProduct / denominator });
        // 6. Perform the division
        return adjustedProduct / denominator;
    }

    /**
     * @notice Calculates ceil(a×b÷denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
     * @param a The multiplicand
     * @param b The multiplier
     * @param denominator The divisor
     * @return result The 256-bit result
     */
    static mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
        let result = FullMath.mulDiv(a, b, denominator);
        if ((a * b) % denominator > BigInt(0)) {
            if (result >= FullMath.MAX_UINT256) {
                throw new Error('Result exceeds MAX_UINT256');
            }
            result++;
        }
        // console.log({ name: "mulDivRoundingUp", a, b, denominator, result });
        return result;
    }
}