/// @title Math functions that do not check inputs or outputs
/// @notice Contains methods that perform common math functions but do not do any overflow or underflow checks
export class UnsafeMath {
    /// @notice Returns ceil(x / y)
    /// @dev division by 0 has unspecified behavior, and must be checked externally
    /// @param x The dividend (as bigint)
    /// @param y The divisor (as bigint)
    /// @return z The quotient, ceil(x / y)
    static divRoundingUp(x: bigint, y: bigint): bigint {
        // Note: This intentionally does not check for division by zero
        // to match Solidity's unspecified behavior for division by zero

        const quotient = x / y;
        const remainder = x % y;
        const result = remainder > 0n ? quotient + 1n : quotient;
        // console.log({ name: "divRoundingUp", x, y, result });
        return result
    }
}