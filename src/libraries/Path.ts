import { BytesLib } from './BytesLib';

export class Path {
    private static readonly ADDR_SIZE = '20'; // bytes
    private static readonly FEE_SIZE = '3';   // bytes
    private static readonly NEXT_OFFSET = this.add(this.ADDR_SIZE, this.FEE_SIZE);
    private static readonly POP_OFFSET = this.add(this.NEXT_OFFSET, this.ADDR_SIZE);
    private static readonly MULTIPLE_POOLS_MIN_LENGTH = this.add(this.POP_OFFSET, this.NEXT_OFFSET);

    /**
     * Returns true if the path contains two or more pools
     * @param path The encoded swap path as hex string
     * @returns True if path contains two or more pools
     */
    public static hasMultiplePools(path: string): boolean {
        return this.compare((path.length / 2).toString(), this.MULTIPLE_POOLS_MIN_LENGTH) >= 0;
    }

    /**
     * Returns the number of pools in the path
     * @param path The encoded swap path as hex string
     * @returns The number of pools as string
     */
    public static numPools(path: string): string {
        // (path.length - ADDR_SIZE) / NEXT_OFFSET
        const numerator = this.sub((path.length / 2).toString(), this.ADDR_SIZE);
        return this.div(numerator, this.NEXT_OFFSET);
    }

    /**
     * Decodes the first pool in path
     * @param path The encoded swap path as hex string
     * @returns tokenA, tokenB, and fee
     */
    public static decodeFirstPool(path: string): { tokenA: string; tokenB: string; fee: string } {
        const tokenA = BytesLib.toAddress(path, '0');
        const fee = BytesLib.toUint24(path, this.ADDR_SIZE);
        const tokenB = BytesLib.toAddress(path, this.NEXT_OFFSET);
        return { tokenA, tokenB, fee };
    }

    /**
     * Gets the segment corresponding to the first pool in the path
     * @param path The encoded swap path as hex string
     * @returns The segment containing all data for the first pool
     */
    public static getFirstPool(path: string): string {
        return BytesLib.slice(path, '0', this.POP_OFFSET);
    }

    /**
     * Skips a token + fee element and returns the remainder
     * @param path The encoded swap path as hex string
     * @returns The remaining path after skipping one token+fee
     */
    public static skipToken(path: string): string {
        const newLength = this.sub((path.length / 2).toString(), this.NEXT_OFFSET);
        return BytesLib.slice(path, this.NEXT_OFFSET, newLength);
    }

    /**
     * Encodes a path segment (tokenA + fee + tokenB)x
     * @param tokenA First token address
     * @param fee Pool fee
     * @param tokenB Second token address
     * @returns Encoded path segment
     */
    public static encode(tokenA: string, fee: string, tokenB: string): string {
        // Remove '0x' prefix if present
        const cleanTokenA = tokenA.startsWith('0x') ? tokenA.slice(2) : tokenA;
        const cleanTokenB = tokenB.startsWith('0x') ? tokenB.slice(2) : tokenB;

        // Convert fee to 3-byte hex string
        const feeHex = this.to3ByteHex(fee);

        return `0x${cleanTokenA}${feeHex}${cleanTokenB}`;
    }

    // Helper methods for string-based arithmetic operations

    private static add(a: string, b: string): string {
        return (parseInt(a, 10) + parseInt(b, 10)).toString();
    }

    private static sub(a: string, b: string): string {
        return (parseInt(a, 10) - parseInt(b, 10)).toString();
    }

    private static div(a: string, b: string): string {
        return Math.floor(parseInt(a, 10) / parseInt(b, 10)).toString();
    }

    private static compare(a: string, b: string): number {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        return numA === numB ? 0 : numA > numB ? 1 : -1;
    }

    private static to3ByteHex(value: string): string {
        const num = parseInt(value, 10);
        if (num < 0 || num > 16777215) { // 2^24 - 1
            throw new Error('Fee value out of range for uint24');
        }
        return num.toString(16).padStart(6, '0');
    }
}