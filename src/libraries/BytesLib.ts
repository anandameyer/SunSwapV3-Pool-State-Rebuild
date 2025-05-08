export class BytesLib {
    /**
     * Slices a portion of bytes from the input bytes string
     * @param _bytes Hex string (with 0x prefix) to slice from
     * @param _start Start position as string
     * @param _length Length to slice as string
     * @returns Sliced hex string
     */
    public static slice(_bytes: string, _start: string, _length: string): string {
        // Convert string numbers to numbers for validation (avoid in production)
        const start = parseInt(_start, 10);
        const length = parseInt(_length, 10);
        const bytesLength = (_bytes.length - 2) / 2; // Remove 0x and count bytes

        // Validate inputs
        if (length + 31 < length) throw new Error('slice_overflow');
        if (start + length < start) throw new Error('slice_overflow');
        if (bytesLength < start + length) throw new Error('slice_outOfBounds');

        if (length === 0) {
            return '0x';
        }

        // Remove 0x prefix
        const cleanBytes = _bytes.startsWith('0x') ? _bytes.slice(2) : _bytes;

        // Calculate start and end positions (in characters)
        const startPos = start * 2;
        const endPos = startPos + length * 2;

        // Extract the slice
        const sliced = cleanBytes.slice(startPos, endPos);

        return `0x${sliced}`;
    }

    /**
     * Extracts an address from a bytes string at a specific position
     * @param _bytes Hex string to read from
     * @param _start Start position as string
     * @returns Extracted address as string
     */
    public static toAddress(_bytes: string, _start: string): string {
        const start = parseInt(_start, 10);
        const bytesLength = (_bytes.length - 2) / 2;

        if (start + 20 < start) throw new Error('toAddress_overflow');
        if (bytesLength < start + 20) throw new Error('toAddress_outOfBounds');

        // Address is 20 bytes = 40 hex characters
        const addressStart = 2 + start * 2; // Skip 0x and start position
        const addressHex = _bytes.slice(addressStart, addressStart + 40);

        return `0x${addressHex}`;
    }

    /**
     * Extracts a uint24 from a bytes string at a specific position
     * @param _bytes Hex string to read from
     * @param _start Start position as string
     * @returns Extracted uint24 as string
     */
    public static toUint24(_bytes: string, _start: string): string {
        const start = parseInt(_start, 10);
        const bytesLength = (_bytes.length - 2) / 2;

        if (start + 3 < start) throw new Error('toUint24_overflow');
        if (bytesLength < start + 3) throw new Error('toUint24_outOfBounds');

        // Uint24 is 3 bytes = 6 hex characters
        const uintStart = 2 + start * 2; // Skip 0x and start position
        const uintHex = _bytes.slice(uintStart, uintStart + 6);

        // Convert hex to decimal string
        return parseInt(uintHex, 16).toString();
    }

    /**
     * Helper function to convert a number string to hex with padding
     * @param value Number string to convert
     * @param bytesSize Number of bytes to pad to
     * @returns Padded hex string (without 0x prefix)
     */
    private static toPaddedHex(value: string, bytesSize: number): string {
        const num = parseInt(value, 10);
        const hex = num.toString(16);
        return hex.padStart(bytesSize * 2, '0');
    }
}