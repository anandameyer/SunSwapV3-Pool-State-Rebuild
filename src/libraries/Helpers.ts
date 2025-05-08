import { keccak256 } from "ethers";
import { Path } from "./Path";
import { PoolAddress } from "./PoolAddress";

export function createPoolId(token0: string, token1: string, fee: number): string {
    const poolKey = PoolAddress.getPoolKey(token0, token1, fee);
    return Path.encode(poolKey.token0, fee.toString(), poolKey.token1);
}

export function createPositionInfoId(owner: string, tickLower: number, tickUpper: number): string {
    return keccak256(new TextEncoder().encode(`${owner}-${tickLower}-${tickUpper}`));
}