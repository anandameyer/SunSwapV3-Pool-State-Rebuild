/**
 * @title FixedPoint128
 * @notice A library for handling binary fixed point numbers, see https://en.wikipedia.org/wiki/Q_(number_format)
 */
export class FixedPoint128 {
    /**
     * The Q128 fixed point number representation
     * @dev Equal to 2^128, used for fixed-point arithmetic
     */
    static readonly Q128: bigint = 0x100000000000000000000000000000000n;

    /**
     * Private constructor to prevent instantiation
     * @private
     */
    private constructor() {}
}