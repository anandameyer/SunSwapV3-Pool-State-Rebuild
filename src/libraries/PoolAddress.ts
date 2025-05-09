import { ethers } from 'ethers';

export type PoolKey = {
    token0: string,
    token1: string,
    fee: number
}

export class PoolAddress {
    // POOL_INIT_CODE_HASH for Uniswap V3
    static readonly POOL_INIT_CODE_HASH = '0xba928a717d71946d75999ef1adef801a79cd34a20efecea8b2876b85f5f49580';



    /**
     * Returns PoolKey with ordered token0 and token1 assignments
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param fee Fee amount (uint24 in Solidity)
     * @returns PoolKey instance with sorted tokens
     */
    static getPoolKey(tokenA: string, tokenB: string, fee: number): PoolKey {
        // Convert to checksum addresses for proper comparison
        const addrA = ethers.getAddress(tokenA);
        const addrB = ethers.getAddress(tokenB);

        const numA = BigInt(addrA.toLowerCase());
        const numB = BigInt(addrB.toLowerCase());

        return numA < numB
            ? { token0: addrA, token1: addrB, fee: fee }
            : { token0: addrB, token1: addrA, fee: fee };
    }

    /**
     * Deterministically computes the pool address given factory and PoolKey
     * @param factory Factory contract address
     * @param key PoolKey instance
     * @returns Pool contract address
     */
    static computeAddress(factory: string, key: PoolKey): string {
        const token0 = ethers.getAddress(key.token0);
        const token1 = ethers.getAddress(key.token1);

        if (token0.toLowerCase() >= token1.toLowerCase()) {
            throw new Error('Tokens must be in ascending order');
        }

        // Create the salt (keccak256 hash of token0, token1, fee)
        const salt = ethers.keccak256(
            new TextEncoder().encode(
                `${token0.substring(2)}${token1.substring(2)}${key.fee.toString()}`
            )

            // ['address', 'address', 'uint24'],
            // [token0, token1, key.fee]
        );

        // Compute the CREATE2 address
        const initCodeHash = this.POOL_INIT_CODE_HASH;
        const create2Input = `0x41${factory.slice(2)}${salt.slice(2)}${initCodeHash.slice(2)}`;
        const poolAddress = ethers.getAddress(
            `0x${ethers.keccak256(create2Input).slice(-40)}`
        );

        return poolAddress;
    }
}