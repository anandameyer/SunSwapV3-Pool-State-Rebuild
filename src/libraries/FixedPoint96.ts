/**
 * @title FixedPoint96
 * @notice A library for handling binary fixed point numbers (Q96 format)
 * @dev Used for price calculations in Uniswap-style AMMs
 */
export class FixedPoint96 {
    /**
     * The number of binary digits used to represent the fractional part
     * @dev 96 bits of resolution for fixed-point numbers
     */
    static readonly RESOLUTION: number = 96;

    /**
     * The scalar value for Q96 fixed-point numbers
     * @dev Equal to 2^96, represented as a bigint
     */
    static readonly Q96: bigint = 0x1000000000000000000000000n;

    // Private constructor to prevent instantiation
    private constructor() {}
}