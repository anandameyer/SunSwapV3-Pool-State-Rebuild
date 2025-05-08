import { Store } from "@subsquid/typeorm-store";
import { LiquidityMath } from "../libraries/LiquidityMath";
import { SafeCast } from "../libraries/SafeCast";
// import { } from "../libraries/TickMath";
import { TickMath } from "../libraries/TickMath";
import { TickInfo } from "../model";


export class TickInfoStore {
    private readonly store: Store

    constructor(store: Store) {
        this.store = store;
    }

    async get(poolId: string, tick: number): Promise<TickInfo | undefined> {
        return await this.store.findOneBy(TickInfo, { id: `${poolId}-${tick}` });
    }

    /**
     * Retrieves fee growth data between two ticks
     * @param tickLower The lower tick boundary (number)
     * @param tickUpper The upper tick boundary (number)
     * @param tickCurrent The current tick (number)
     * @param feeGrowthGlobal0X128 Global fee growth for token0 (bigint)
     * @param feeGrowthGlobal1X128 Global fee growth for token1 (bigint)
     * @returns Fee growth inside the tick boundaries [feeGrowthInside0X128, feeGrowthInside1X128] (both bigint)
     */
    async getFeeGrowthInside(
        poolId: string,
        tickLower: number,
        tickUpper: number,
        tickCurrent: number,
        feeGrowthGlobal0X128: bigint,
        feeGrowthGlobal1X128: bigint
    ): Promise<[bigint, bigint]> {
        const lower = await this.store.findOneBy(TickInfo, { id: `${poolId}-${tickLower}` });
        if (!lower) throw new Error("getFeeGrowthInside: lower tick not found")
        const upper = await this.store.findOneBy(TickInfo, { id: `${poolId}-${tickUpper}` });
        if (!upper) throw new Error("getFeeGrowthInside: upper tick not found")

        // Calculate fee growth below
        let feeGrowthBelow0X128: bigint;
        let feeGrowthBelow1X128: bigint;
        if (tickCurrent >= tickLower) {
            feeGrowthBelow0X128 = lower.feeGrowthOutside0X128;
            feeGrowthBelow1X128 = lower.feeGrowthOutside1X128;
        } else {
            feeGrowthBelow0X128 = feeGrowthGlobal0X128 - lower.feeGrowthOutside0X128;
            feeGrowthBelow1X128 = feeGrowthGlobal1X128 - lower.feeGrowthOutside1X128;
        }

        // Calculate fee growth above
        let feeGrowthAbove0X128: bigint;
        let feeGrowthAbove1X128: bigint;
        if (tickCurrent < tickUpper) {
            feeGrowthAbove0X128 = upper.feeGrowthOutside0X128;
            feeGrowthAbove1X128 = upper.feeGrowthOutside1X128;
        } else {
            feeGrowthAbove0X128 = feeGrowthGlobal0X128 - upper.feeGrowthOutside0X128;
            feeGrowthAbove1X128 = feeGrowthGlobal1X128 - upper.feeGrowthOutside1X128;
        }

        const feeGrowthInside0X128 = feeGrowthGlobal0X128 - feeGrowthBelow0X128 - feeGrowthAbove0X128;
        const feeGrowthInside1X128 = feeGrowthGlobal1X128 - feeGrowthBelow1X128 - feeGrowthAbove1X128;

        return [feeGrowthInside0X128, feeGrowthInside1X128];
    }

    /**
     * Updates a tick and returns whether it was flipped
     * @param tick The tick to update (number)
     * @param tickCurrent The current tick (number)
     * @param liquidityDelta Change in liquidity (bigint)
     * @param feeGrowthGlobal0X128 Global fee growth for token0 (bigint)
     * @param feeGrowthGlobal1X128 Global fee growth for token1 (bigint)
     * @param secondsPerLiquidityCumulativeX128 Seconds per liquidity (bigint)
     * @param tickCumulative Cumulative tick value (bigint)
     * @param time Current timestamp (number)
     * @param upper Whether updating upper tick (boolean)
     * @param maxLiquidity Max liquidity per tick (bigint)
     * @returns Whether the tick was flipped (boolean)
     */
    async update(
        poolId: string,
        tick: number,
        tickCurrent: number,
        liquidityDelta: bigint,
        feeGrowthGlobal0X128: bigint,
        feeGrowthGlobal1X128: bigint,
        secondsPerLiquidityCumulativeX128: bigint,
        tickCumulative: bigint,
        time: bigint,
        upper: boolean,
        maxLiquidity: bigint
    ): Promise<boolean> {
        let info = await this.store.findOneBy(TickInfo, { id: `${poolId}-${tick}` }) || getEmptyTick(poolId, tick);
        // if (!info) throw new Error("update: tick not found");

        const liquidityGrossBefore = info.liquidityGross;
        const liquidityGrossAfter = LiquidityMath.addDelta(liquidityGrossBefore, liquidityDelta);

        if (liquidityGrossAfter > maxLiquidity) throw new Error('LO');

        const flipped = (liquidityGrossAfter === 0n) !== (liquidityGrossBefore === 0n);

        if (liquidityGrossBefore === 0n) {
            // Initialize tick data if crossing for first time
            if (tick <= tickCurrent) {
                info = new TickInfo({
                    ...info,
                    feeGrowthOutside0X128: feeGrowthGlobal0X128,
                    feeGrowthOutside1X128: feeGrowthGlobal1X128,
                    secondsPerLiquidityOutsideX128: secondsPerLiquidityCumulativeX128,
                    tickCumulativeOutside: tickCumulative,
                    secondsOutside: time,
                });
            }
            info.initialized = true;
        }

        // Update liquidity values
        info.liquidityGross = liquidityGrossAfter;
        info.liquidityNet = upper
            ? SafeCast.toInt128(info.liquidityNet - liquidityDelta)
            : SafeCast.toInt128(info.liquidityNet + liquidityDelta);

        // console.dir(["tick info updated", info], { depth: null });
        await this.store.upsert(info);
        return flipped;
    }

    /**
     * Clears tick data
     * @param tick The tick to clear (number)
     */
    async clear(poolId: string, tick: number): Promise<void> {
        console.log("tick info cleared");
        await this.store.remove(new TickInfo({ id: `${poolId}-${tick}` }));
    }

    /**
     * Transitions to next tick during crossing
     * @param tick The tick being crossed (number)
     * @param feeGrowthGlobal0X128 Global fee growth for token0 (bigint)
     * @param feeGrowthGlobal1X128 Global fee growth for token1 (bigint)
     * @param secondsPerLiquidityCumulativeX128 Seconds per liquidity (bigint)
     * @param tickCumulative Cumulative tick value (bigint)
     * @param time Current timestamp (number)
     * @returns Net liquidity change (bigint)
     */
    async cross(
        poolId: string,
        tick: number,
        feeGrowthGlobal0X128: bigint,
        feeGrowthGlobal1X128: bigint,
        secondsPerLiquidityCumulativeX128: bigint,
        tickCumulative: bigint,
        time: bigint
    ): Promise<bigint> {
        const info = await this.store.findOneBy(TickInfo, { id: `${poolId}-${tick}` });
        if (!info) return 0n;

        const updatedInfo: TickInfo = {
            ...info,
            feeGrowthOutside0X128: feeGrowthGlobal0X128 - info.feeGrowthOutside0X128,
            feeGrowthOutside1X128: feeGrowthGlobal1X128 - info.feeGrowthOutside1X128,
            secondsPerLiquidityOutsideX128: secondsPerLiquidityCumulativeX128 - info.secondsPerLiquidityOutsideX128,
            tickCumulativeOutside: tickCumulative - info.tickCumulativeOutside,
            secondsOutside: time - info.secondsOutside
        };

        console.log("tick info crossed");
        await this.store.upsert(updatedInfo);
        return info.liquidityNet;
    }
}

/**
     * Returns an empty TickInfo object
     * @returns Empty TickInfo
     */
function getEmptyTick(poolId: string, tick: number): TickInfo {
    return new TickInfo({
        id: `${poolId}-${tick}`,
        poolId: poolId,
        liquidityGross: 0n,
        liquidityNet: 0n,
        feeGrowthOutside0X128: 0n,
        feeGrowthOutside1X128: 0n,
        tickCumulativeOutside: 0n,
        secondsPerLiquidityOutsideX128: 0n,
        secondsOutside: 0n,
        initialized: false
    });
}

/**
* Derives max liquidity per tick from given tick spacing
* @param tickSpacing The tick spacing (number)
* @returns Max liquidity per tick (bigint)
*/
export function tickSpacingToMaxLiquidityPerTick(tickSpacing: number): bigint {
    // const minTick = Math.floor(TickMath.MIN_TICK / tickSpacing) * tickSpacing;
    const maxTick = Math.floor(TickMath.MAX_TICK / tickSpacing) * tickSpacing;
    const minTick = -maxTick;
    const numTicks = (maxTick - minTick) / tickSpacing + 1;
    return (2n ** 128n - 1n) / BigInt(numTicks);
}