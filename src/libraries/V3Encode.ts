import { ethers } from 'ethers';

export class V3Encode {
    /**
     * Encodes a path with fees for V3 router
     * @param path Array of token addresses
     * @param fees Array of fee values (uint24)
     * @returns Encoded path as bytes
     */
    public static encodePath(path: string[], fees: number[]): string {
        if (path.length !== fees.length) {
            throw new Error("Path and fees arrays must have the same length");
        }

        let encoded = '0x';

        for (let i = 0; i < path.length; i++) {
            // Convert address to bytes
            const addressBytes = this.addressToBytes(path[i]);

            if (i === path.length - 1) {
                // Last element only has address
                encoded += addressBytes.slice(2); // Remove 0x prefix
            } else {
                // Other elements have address + fee
                const feeBytes = this.uint24ToBytes(fees[i]);
                encoded += addressBytes.slice(2) + feeBytes.slice(2);
            }
        }

        return encoded;
    }

    /**
     * Converts an Ethereum address to its bytes representation
     * @param address Ethereum address
     * @returns Bytes representation (20 bytes)
     */
    private static addressToBytes(address: string): string {
        // Validate address format
        if (!ethers.isAddress(address)) {
            throw new Error(`Invalid address: ${address}`);
        }

        // Remove 0x prefix and pad to 40 characters (20 bytes)
        const cleanAddr = address.toLowerCase().replace('0x', '').padStart(40, '0');
        return `0x${cleanAddr}`;
    }

    /**
     * Converts a uint24 number to its bytes3 representation
     * @param num Number to convert (must be <= 0xFFFFFF)
     * @returns Bytes3 representation
     */
    private static uint24ToBytes(num: number): string {
        if (num > 0xffffff || num < 0) {
            throw new Error(`Number ${num} is out of uint24 range`);
        }

        // Convert to hex and pad to 6 characters (3 bytes)
        const hex = num.toString(16).padStart(6, '0');
        return `0x${hex}`;
    }
}