import { LiquidityMath } from './LiquidityMath';
import { SafeCast } from './SafeCast';
import { TickMath } from './TickMath';

export interface TickInfo {
    liquidityGross: bigint; // uint128
    liquidityNet: bigint; // int128
    feeGrowthOutside0X128: bigint; // uint256
    feeGrowthOutside1X128: bigint; // uint256
    tickCumulativeOutside: bigint; // int56
    secondsPerLiquidityOutsideX128: bigint; // uint160
    secondsOutside: number; // uint32
    initialized: boolean;
}

export class Tick {
    /**
     * Derives max liquidity per tick from given tick spacing
     * @param tickSpacing The tick spacing (number)
     * @returns Max liquidity per tick (bigint)
     */
    static tickSpacingToMaxLiquidityPerTick(tickSpacing: number): bigint {
        const minTick = Math.floor(TickMath.MIN_TICK / tickSpacing) * tickSpacing;
        const maxTick = Math.floor(TickMath.MAX_TICK / tickSpacing) * tickSpacing;
        const numTicks = (maxTick - minTick) / tickSpacing + 1;
        return (2n ** 128n - 1n) / BigInt(numTicks);
    }

    /**
     * Retrieves fee growth data between two ticks
     * @param ticksMap Map containing all tick information
     * @param tickLower The lower tick boundary (number)
     * @param tickUpper The upper tick boundary (number)
     * @param tickCurrent The current tick (number)
     * @param feeGrowthGlobal0X128 Global fee growth for token0 (bigint)
     * @param feeGrowthGlobal1X128 Global fee growth for token1 (bigint)
     * @returns Fee growth inside the tick boundaries [feeGrowthInside0X128, feeGrowthInside1X128] (both bigint)
     */
    static getFeeGrowthInside(
        ticksMap: Map<number, TickInfo>,
        tickLower: number,
        tickUpper: number,
        tickCurrent: number,
        feeGrowthGlobal0X128: bigint,
        feeGrowthGlobal1X128: bigint
    ): [bigint, bigint] {
        const lower = ticksMap.get(tickLower) || this.getEmptyTick();
        const upper = ticksMap.get(tickUpper) || this.getEmptyTick();

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
     * @param ticksMap Map containing all tick information
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
    static update(
        ticksMap: Map<number, TickInfo>,
        tick: number,
        tickCurrent: number,
        liquidityDelta: bigint,
        feeGrowthGlobal0X128: bigint,
        feeGrowthGlobal1X128: bigint,
        secondsPerLiquidityCumulativeX128: bigint,
        tickCumulative: bigint,
        time: number,
        upper: boolean,
        maxLiquidity: bigint
    ): boolean {
        let info = ticksMap.get(tick) || this.getEmptyTick();

        const liquidityGrossBefore = info.liquidityGross;
        const liquidityGrossAfter = LiquidityMath.addDelta(liquidityGrossBefore, liquidityDelta);

        if (liquidityGrossAfter > maxLiquidity) {
            throw new Error('LO');
        }

        const flipped = (liquidityGrossAfter === 0n) !== (liquidityGrossBefore === 0n);

        if (liquidityGrossBefore === 0n) {
            // Initialize tick data if crossing for first time
            if (tick <= tickCurrent) {
                info = {
                    ...info,
                    feeGrowthOutside0X128: feeGrowthGlobal0X128,
                    feeGrowthOutside1X128: feeGrowthGlobal1X128,
                    secondsPerLiquidityOutsideX128: secondsPerLiquidityCumulativeX128,
                    tickCumulativeOutside: tickCumulative,
                    secondsOutside: time,
                };
            }
            info.initialized = true;
        }

        // Update liquidity values
        info.liquidityGross = liquidityGrossAfter;
        info.liquidityNet = upper
            ? SafeCast.toInt128(info.liquidityNet - liquidityDelta)
            : SafeCast.toInt128(info.liquidityNet + liquidityDelta);

        ticksMap.set(tick, info);
        return flipped;
    }

    /**
     * Clears tick data
     * @param ticksMap Map containing all tick information
     * @param tick The tick to clear (number)
     */
    static clear(ticksMap: Map<number, TickInfo>, tick: number): void {
        ticksMap.delete(tick);
    }

    /**
     * Transitions to next tick during crossing
     * @param ticksMap Map containing all tick information
     * @param tick The tick being crossed (number)
     * @param feeGrowthGlobal0X128 Global fee growth for token0 (bigint)
     * @param feeGrowthGlobal1X128 Global fee growth for token1 (bigint)
     * @param secondsPerLiquidityCumulativeX128 Seconds per liquidity (bigint)
     * @param tickCumulative Cumulative tick value (bigint)
     * @param time Current timestamp (number)
     * @returns Net liquidity change (bigint)
     */
    static cross(
        ticksMap: Map<number, TickInfo>,
        tick: number,
        feeGrowthGlobal0X128: bigint,
        feeGrowthGlobal1X128: bigint,
        secondsPerLiquidityCumulativeX128: bigint,
        tickCumulative: bigint,
        time: number
    ): bigint {
        const info = ticksMap.get(tick);
        if (!info) return 0n;

        const updatedInfo: TickInfo = {
            ...info,
            feeGrowthOutside0X128: feeGrowthGlobal0X128 - info.feeGrowthOutside0X128,
            feeGrowthOutside1X128: feeGrowthGlobal1X128 - info.feeGrowthOutside1X128,
            secondsPerLiquidityOutsideX128: secondsPerLiquidityCumulativeX128 - info.secondsPerLiquidityOutsideX128,
            tickCumulativeOutside: tickCumulative - info.tickCumulativeOutside,
            secondsOutside: time - info.secondsOutside
        };

        ticksMap.set(tick, updatedInfo);
        return info.liquidityNet;
    }

    /**
     * Returns an empty TickInfo object
     * @returns Empty TickInfo
     */
    static getEmptyTick(): TickInfo {
        return {
            liquidityGross: 0n,
            liquidityNet: 0n,
            feeGrowthOutside0X128: 0n,
            feeGrowthOutside1X128: 0n,
            tickCumulativeOutside: 0n,
            secondsPerLiquidityOutsideX128: 0n,
            secondsOutside: 0,
            initialized: false
        };
    }
}