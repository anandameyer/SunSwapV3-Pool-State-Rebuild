import { Store } from '@subsquid/typeorm-store';
import { FixedPoint128 } from '../libraries/FixedPoint128';
import { FullMath } from '../libraries/FullMath';
import { createPoolId } from '../libraries/Helpers';
import { LiquidityMath } from '../libraries/LiquidityMath';
import { SqrtPriceMath } from '../libraries/SqrtPriceMath';
import { SwapMath } from '../libraries/SwapMath';
import { TickMath } from '../libraries/TickMath';
import { PositionInfo, Slot } from '../model';
import { FeeGrowthGlobalStore } from '../store/FeeGrowthGlobalStore';
import { ObservationStore } from '../store/ObservationStore';
import { PoolStore } from '../store/PoolStore';
import { PositionInfoStore } from '../store/PositionInfoStore';
import { emptySlot, SlotStore } from '../store/SlotStore';
import { TickBitmapStore } from '../store/TickBitmapStore';
import { TickInfoStore } from '../store/TickInfoStore';
import { V3Router } from './V3Router';

export class V3Pool {
    // public readonly fee: number;
    // public readonly tickSpacing: number;
    // public readonly maxLiquidityPerTick: bigint;
    private readonly token0: string;
    private readonly token1: string;
    private readonly fee: number;
    private readonly observationStore: ObservationStore;
    public readonly positionInfoStore: PositionInfoStore;
    private readonly tickInfoStore: TickInfoStore;
    private readonly tickBitmapStore: TickBitmapStore;
    private readonly feeGrowthGlobalStore: FeeGrowthGlobalStore;
    private readonly slotStore: SlotStore;
    private readonly poolStore: PoolStore;
    private readonly blockTimestamp: number;
    private readonly blockNumber: number;
    public readonly poolId: string;
    private readonly owner: string;
    private readonly store: Store;

    constructor(store: Store, owner: string, token0: string, token1: string, fee: number, blockTimestamp: number, blockNumber: number) {
        const poolStore = new PoolStore(store);
        this.poolId = createPoolId(token0, token1, fee);
        // this.poolId = ethers.keccak256(new TextEncoder().encode(`${token0.substring(2)}${token1.substring(2)}${fee.toString()}`));
        this.token0 = token0;
        this.token1 = token1;
        this.fee = fee;
        this.observationStore = new ObservationStore(store);
        this.positionInfoStore = new PositionInfoStore(store);
        this.tickInfoStore = new TickInfoStore(store);
        this.tickBitmapStore = new TickBitmapStore(store);
        this.slotStore = new SlotStore(store);
        this.feeGrowthGlobalStore = new FeeGrowthGlobalStore(store);
        this.poolStore = poolStore;
        this.blockTimestamp = blockTimestamp;
        this.blockNumber = blockNumber;
        this.owner = owner;
        this.store = store;
    }

    // private async balance0(): Promise<bigint> {
    //     const token = new ethers.Contract(this.token0, [
    //         'function balanceOf(address) view returns (uint256)'
    //     ]) as unknown as IERC20Minimal;
    //     return await token.balanceOf(this.address);
    // }

    // private async balance1(): Promise<bigint> {
    //     const token = new ethers.Contract(this.token1, [
    //         'function balanceOf(address) view returns (uint256)'
    //     ]) as unknown as IERC20Minimal;
    //     return await token.balanceOf(this.address);
    // }

    private checkTicks(tickLower: number, tickUpper: number): void {
        if (tickLower >= tickUpper) throw new Error('TLU');
        if (tickLower < TickMath.MIN_TICK) throw new Error('TLM');
        if (tickUpper > TickMath.MAX_TICK) throw new Error('TUM');
    }

    private _blockTimestamp(): bigint {
        return BigInt(this.blockTimestamp);
    }

    // public async snapshotCumulativesInside(
    //     tickLower: number,
    //     tickUpper: number
    // ): Promise<[bigint, bigint, bigint]> {
    //     this.checkTicks(tickLower, tickUpper);

    //     const lower = await this.tickInfoStore.get(this.poolId, tickLower);
    //     if (!lower) throw new Error("snapshotCumulativesInside: tick lower not found");
    //     const upper = await this.tickInfoStore.get(this.poolId, tickUpper);
    //     if (!upper) throw new Error("snapshotCumulativesInside: tick upper not found");

    //     if (!lower.initialized || !upper.initialized) {
    //         throw new Error('snapshotCumulativesInside: Tick not initialized');
    //     }

    //     let slot0 = await this.slotStore.get(this.poolId) || emptySlot(this.poolId);
    //     const pool = await this.poolStore.getById(this.poolId);
    //     if (!pool) throw Error("snapshotCumulativesInside: Pool not found");

    //     if (slot0.tick < tickLower) {
    //         return [
    //             lower.tickCumulativeOutside - upper.tickCumulativeOutside,
    //             lower.secondsPerLiquidityOutsideX128 - upper.secondsPerLiquidityOutsideX128,
    //             lower.secondsOutside - upper.secondsOutside
    //         ];
    //     } else if (slot0.tick < tickUpper) {
    //         const time = this._blockTimestamp();
    //         const [tickCumulative, secondsPerLiquidityCumulativeX128] =
    //             await this.observationStore.observeSingle(
    //                 this.poolId,
    //                 time,
    //                 0n,
    //                 slot0.tick,
    //                 slot0.observationIndex,
    //                 pool.liquidity,
    //                 slot0.observationCardinality
    //             );

    //         return [
    //             tickCumulative - lower.tickCumulativeOutside - upper.tickCumulativeOutside,
    //             secondsPerLiquidityCumulativeX128 -
    //             lower.secondsPerLiquidityOutsideX128 -
    //             upper.secondsPerLiquidityOutsideX128,
    //             time - lower.secondsOutside - upper.secondsOutside
    //         ];
    //     } else {
    //         return [
    //             upper.tickCumulativeOutside - lower.tickCumulativeOutside,
    //             upper.secondsPerLiquidityOutsideX128 - lower.secondsPerLiquidityOutsideX128,
    //             upper.secondsOutside - lower.secondsOutside
    //         ];
    //     }
    // }

    // public async observe(secondsAgos: bigint[]): Promise<[bigint[], bigint[]]> {
    //     const slot0 = await this.slotStore.get(this.poolId) || emptySlot(this.poolId);
    //     const pool = await this.poolStore.getById(this.poolId);
    //     if (!pool) throw Error("observe: Pool not found");
    //     return await this.observationStore.observe(
    //         this.poolId,
    //         this._blockTimestamp(),
    //         secondsAgos,
    //         slot0.tick,
    //         slot0.observationIndex,
    //         pool.liquidity,
    //         slot0.observationCardinality
    //     );
    // }

    public async increaseObservationCardinalityNext(observationCardinalityNext: number): Promise<void> {
        const slot0 = await this.slotStore.get(this.poolId) || emptySlot(this.poolId);
        if (!slot0.unlocked) throw new Error('increaseObservationCardinalityNext: LOK');

        slot0.unlocked = false;

        const observationCardinalityNextOld = slot0.observationCardinalityNext;
        const observationCardinalityNextNew = await this.observationStore.grow(this.poolId, observationCardinalityNextOld, observationCardinalityNext);

        slot0.observationCardinalityNext = observationCardinalityNextNew;

        // if (observationCardinalityNextOld !== observationCardinalityNextNew) {
        //     // Emit event
        // }

        slot0.unlocked = true;
        await this.slotStore.save(slot0);
    }

    public async initialize(sqrtPriceX96: bigint): Promise<void> {
        let slot0 = await this.slotStore.get(this.poolId) || emptySlot(this.poolId);
        if (slot0.sqrtPriceX96 !== 0n) throw new Error('initialize: AI');

        const tick = TickMath.getTickAtSqrtRatio(sqrtPriceX96);
        const [cardinality, cardinalityNext] = await this.observationStore.initialize(this.poolId, this._blockTimestamp());

        slot0.sqrtPriceX96 = sqrtPriceX96;
        slot0.tick = tick;
        slot0.observationCardinality = cardinality;
        slot0.observationCardinalityNext = cardinalityNext;
        slot0.unlocked = true;

        await this.slotStore.save(slot0);

        // Emit Initialize event
    }

    private async _modifyPosition(params: {
        owner: string;
        tickLower: number;
        tickUpper: number;
        liquidityDelta: bigint;
    }): Promise<[PositionInfo, bigint, bigint]> {
        // console.dir(["_modifyPosition", params], { depth: null });
        this.checkTicks(params.tickLower, params.tickUpper);

        const oldSlot0 = await this.slotStore.get(this.poolId);
        if (!oldSlot0) throw new Error("_modifyPosition: Slot not found");
        // console.dir(["_modifyPosition.oldSlot0", oldSlot0], { depth: null });
        const newSlot0 = new Slot({ ...oldSlot0 });
        const position = await this._updatePosition(
            params.owner,
            params.tickLower,
            params.tickUpper,
            params.liquidityDelta,
            oldSlot0.tick
        );

        // console.dir(["_modifyPosition.position", position], { depth: null });

        let amount0 = 0n;
        let amount1 = 0n;

        const pool = await this.poolStore.getById(this.poolId);
        if (!pool) throw new Error("_modifyPosition: Pool not found");

        if (params.liquidityDelta !== 0n) {
            // console.log(1);
            if (oldSlot0.tick < params.tickLower) {
                // console.log(2);
                amount0 = SqrtPriceMath.getAmount0DeltaSigned(
                    TickMath.getSqrtRatioAtTick(params.tickLower),
                    TickMath.getSqrtRatioAtTick(params.tickUpper),
                    params.liquidityDelta
                );
            } else if (oldSlot0.tick < params.tickUpper) {
                // console.log(3);
                const liquidityBefore = pool.liquidity;

                const [observationIndex, observationCardinality] = await this.observationStore.write(
                    this.poolId,
                    oldSlot0.observationIndex,
                    this._blockTimestamp(),
                    oldSlot0.tick,
                    liquidityBefore,
                    oldSlot0.observationCardinality,
                    oldSlot0.observationCardinalityNext
                );

                newSlot0.observationIndex = observationIndex;
                newSlot0.observationCardinality = observationCardinality;

                amount0 = SqrtPriceMath.getAmount0DeltaSigned(
                    oldSlot0.sqrtPriceX96,
                    TickMath.getSqrtRatioAtTick(params.tickUpper),
                    params.liquidityDelta
                );

                amount1 = SqrtPriceMath.getAmount1DeltaSigned(
                    TickMath.getSqrtRatioAtTick(params.tickLower),
                    oldSlot0.sqrtPriceX96,
                    params.liquidityDelta
                );

                pool.liquidity = LiquidityMath.addDelta(liquidityBefore, params.liquidityDelta);
                await this.poolStore.save(pool);
            } else {
                // console.log(4);
                amount1 = SqrtPriceMath.getAmount1DeltaSigned(
                    TickMath.getSqrtRatioAtTick(params.tickLower),
                    TickMath.getSqrtRatioAtTick(params.tickUpper),
                    params.liquidityDelta
                );

            }
        }

        await this.slotStore.save(newSlot0);

        return [position, amount0, amount1];
    }

    private async _updatePosition(
        owner: string,
        tickLower: number,
        tickUpper: number,
        liquidityDelta: bigint,
        currentTick: number
    ): Promise<PositionInfo> {
        // console.dir(["_updatePosition", { owner, tickLower, tickUpper, liquidityDelta, currentTick }], { depth: null });
        let position = await this.positionInfoStore.get(this.poolId, owner, tickLower, tickUpper);
        const slot0 = await this.slotStore.get(this.poolId);
        if (!slot0) throw new Error("_updatePosition: Slot0 not found");
        const feeGrowthGlobal = await this.feeGrowthGlobalStore.get(this.poolId);

        const feeGrowthGlobal0X128 = feeGrowthGlobal.feeGrowthGlobal0X128;
        const feeGrowthGlobal1X128 = feeGrowthGlobal.feeGrowthGlobal1X128;
        const pool = await this.poolStore.getById(this.poolId);
        if (!pool) throw Error("_updatePosition: Pool not found");

        let flippedLower = false;
        let flippedUpper = false;

        if (liquidityDelta !== 0n) {
            const time = this._blockTimestamp();
            const [tickCumulative, secondsPerLiquidityCumulativeX128] =
                await this.observationStore.observeSingle(
                    this.poolId,
                    time,
                    0n,
                    slot0.tick,
                    slot0.observationIndex,
                    pool.liquidity,
                    slot0.observationCardinality
                );

            flippedLower = await this.tickInfoStore.update(
                this.poolId,
                tickLower,
                currentTick,
                liquidityDelta,
                feeGrowthGlobal0X128,
                feeGrowthGlobal1X128,
                secondsPerLiquidityCumulativeX128,
                tickCumulative,
                time,
                false,
                pool.maxLiquidityPerTick
            );

            flippedUpper = await this.tickInfoStore.update(
                this.poolId,
                tickUpper,
                currentTick,
                liquidityDelta,
                feeGrowthGlobal0X128,
                feeGrowthGlobal1X128,
                secondsPerLiquidityCumulativeX128,
                tickCumulative,
                time,
                true,
                pool.maxLiquidityPerTick
            );

            if (flippedLower) {
                await this.tickBitmapStore.flipTick(this.poolId, tickLower, pool.tickSpacing);
            }
            if (flippedUpper) {
                await this.tickBitmapStore.flipTick(this.poolId, tickUpper, pool.tickSpacing);
            }
        }

        const [feeGrowthInside0X128, feeGrowthInside1X128] = await this.tickInfoStore.getFeeGrowthInside(
            this.poolId,
            tickLower,
            tickUpper,
            currentTick,
            feeGrowthGlobal0X128,
            feeGrowthGlobal1X128
        );

        position = await this.positionInfoStore.update(position, liquidityDelta, feeGrowthInside0X128, feeGrowthInside1X128);

        if (liquidityDelta < 0n) {
            if (flippedLower) {
                await this.tickInfoStore.clear(this.poolId, tickLower);
            }
            if (flippedUpper) {
                await this.tickInfoStore.clear(this.poolId, tickUpper);
            }
        }

        return position;
    }

    public async mint(
        recipient: string,
        tickLower: number,
        tickUpper: number,
        amount: bigint,
        data: string
    ): Promise<[bigint, bigint]> {
        if (amount <= 0n) throw new Error('mint: Amount must be positive');

        // console.dir(["mint", { recipient, tickLower, tickUpper, amount, data }], { depth: null });

        const [, amount0Int, amount1Int] = await this._modifyPosition({
            owner: recipient,
            tickLower,
            tickUpper,
            liquidityDelta: amount
        });

        // console.dir(["mint._modifyPosition", { amount0Int, amount1Int }], { depth: null });

        const amount0 = BigInt.asUintN(256, amount0Int);
        const amount1 = BigInt.asUintN(256, amount1Int);


        // let balance0Before = 0n;
        // let balance1Before = 0n;

        // if (amount0 > 0n) balance0Before = await this.balance0();
        // if (amount1 > 0n) balance1Before = await this.balance1();

        // const callback = new ethers.Contract(ethers.getAddress(ethers.hexlify('0')), [
        //     'function uniswapV3MintCallback(uint256,uint256,bytes)'
        // ]) as unknown as IUniswapV3MintCallback;

        // await callback.uniswapV3MintCallback(amount0, amount1, data);

        // if (amount0 > 0n) {
        //     const balance0After = await this.balance0();
        //     if (balance0Before + amount0 > balance0After) throw new Error('M0');
        // }
        // if (amount1 > 0n) {
        //     const balance1After = await this.balance1();
        //     if (balance1Before + amount1 > balance1After) throw new Error('M1');
        // }

        // Emit Mint event
        return [amount0, amount1];
    }

    public async collect(
        recipient: string,
        tickLower: number,
        tickUpper: number,
        amount0Requested: bigint,
        amount1Requested: bigint
    ): Promise<[bigint, bigint]> {
        const position = await this.positionInfoStore.get(this.poolId, recipient, tickLower, tickUpper);
        // const position = this.positions.get(positionKey) || Position.getEmptyPosition();

        const amount0 = amount0Requested > position.tokensOwed0 ? position.tokensOwed0 : amount0Requested;
        const amount1 = amount1Requested > position.tokensOwed1 ? position.tokensOwed1 : amount1Requested;

        if (amount0 > 0n) {
            position.tokensOwed0 -= amount0;
            // await TransferHelper.safeTransfer(this.token0, recipient, amount0);
        }
        if (amount1 > 0n) {
            position.tokensOwed1 -= amount1;
            // await TransferHelper.safeTransfer(this.token1, recipient, amount1);
        }

        await this.positionInfoStore.save(position);

        // this.positions.set(positionKey, position);

        // Emit Collect event
        return [amount0, amount1];
    }

    public async burn(
        tickLower: number,
        tickUpper: number,
        amount: bigint,
    ): Promise<[bigint, bigint]> {
        // console.dir(["burn", { tickLower, tickUpper, amount }], { depth: null });
        const [position, amount0Int, amount1Int] = await this._modifyPosition({
            owner: this.owner,
            tickLower,
            tickUpper,
            liquidityDelta: -amount
        });

        const amount0 = BigInt.asUintN(256, -amount0Int);
        const amount1 = BigInt.asUintN(256, -amount1Int);

        if (amount0 > 0n || amount1 > 0n) {
            position.tokensOwed0 += amount0;
            position.tokensOwed1 += amount1;
        }

        await this.positionInfoStore.save(position);

        // Emit Burn event
        return [amount0, amount1];
    }

    public async swap(
        recipient: string,
        zeroForOne: boolean,
        amountSpecified: bigint,
        sqrtPriceLimitX96: bigint,
        data: string
    ): Promise<[bigint, bigint]> {
        if (amountSpecified === 0n) throw new Error('AS');

        let slot0 = await this.slotStore.get(this.poolId) || emptySlot(this.poolId);
        const slot0Start = slot0;
        if (!slot0Start.unlocked) throw new Error("swap: Slot not found");
        // if (!slot0Start.unlocked) return [0n, 0n];

        // if (zeroForOne && (sqrtPriceLimitX96 < slot0Start.sqrtPriceX96 || sqrtPriceLimitX96 > TickMath.MIN_SQRT_RATIO)) throw new Error('SPL');
        // if (!zeroForOne && (sqrtPriceLimitX96 > slot0Start.sqrtPriceX96 || sqrtPriceLimitX96 < TickMath.MAX_SQRT_RATIO)) throw new Error('SPL');

        const isValidPriceLimit = zeroForOne
            ? sqrtPriceLimitX96 < slot0Start.sqrtPriceX96 && sqrtPriceLimitX96 > TickMath.MIN_SQRT_RATIO
            : sqrtPriceLimitX96 > slot0Start.sqrtPriceX96 && sqrtPriceLimitX96 < TickMath.MAX_SQRT_RATIO;

        if (!isValidPriceLimit) throw new Error('SPL');

        const pool = await this.poolStore.getById(this.poolId);

        if (!pool) throw Error("swap: Pool not found");

        // console.dir(["swap", { recipient, zeroForOne, amountSpecified, sqrtPriceLimitX96 }], { depth: null });

        slot0.unlocked = false;

        const cache = {
            liquidityStart: pool.liquidity,
            blockTimestamp: this._blockTimestamp(),
            feeProtocol: zeroForOne ? (slot0Start.feeProtocol % 16) : (slot0Start.feeProtocol >> 4),
            secondsPerLiquidityCumulativeX128: 0n,
            tickCumulative: 0n,
            computedLatestObservation: false
        };

        const exactInput = amountSpecified > 0n;
        const feeGrowthGlobal = await this.feeGrowthGlobalStore.get(this.poolId);

        const state = {
            amountSpecifiedRemaining: amountSpecified,
            amountCalculated: 0n,
            sqrtPriceX96: slot0Start.sqrtPriceX96,
            tick: slot0Start.tick,
            feeGrowthGlobalX128: zeroForOne ? feeGrowthGlobal.feeGrowthGlobal0X128 : feeGrowthGlobal.feeGrowthGlobal1X128,
            protocolFee: 0n,
            liquidity: cache.liquidityStart
        };

        let asr = 0n;

        while (state.amountSpecifiedRemaining !== 0n && state.sqrtPriceX96 !== sqrtPriceLimitX96) {
            // console.log("while", state.amountSpecifiedRemaining, state.sqrtPriceX96, sqrtPriceLimitX96);
            if (asr != 0n && asr == state.amountSpecifiedRemaining) throw new Error("infinite loop detected");

            const step = {
                sqrtPriceStartX96: state.sqrtPriceX96,
                tickNext: 0,
                initialized: false,
                sqrtPriceNextX96: 0n,
                amountIn: 0n,
                amountOut: 0n,
                feeAmount: 0n
            };

            [step.tickNext, step.initialized] = await this.tickBitmapStore.nextInitializedTickWithinOneWord(
                this.poolId,
                state.tick,
                pool.tickSpacing,
                zeroForOne
            );

            step.tickNext = Math.max(TickMath.MIN_TICK, Math.min(TickMath.MAX_TICK, step.tickNext));
            step.sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(step.tickNext);

            // console.log("getSqrtRatioAtTick", step.tickNext, step.sqrtPriceNextX96);
            const useParams = zeroForOne ? step.sqrtPriceNextX96 < sqrtPriceLimitX96 : step.sqrtPriceNextX96 > sqrtPriceLimitX96;


            [state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount] = SwapMath.computeSwapStep(
                state.sqrtPriceX96,
                useParams ? sqrtPriceLimitX96 : step.sqrtPriceNextX96,
                state.liquidity,
                state.amountSpecifiedRemaining,
                BigInt(pool.fee)
            );

            // console.log(
            //     "computeSwapStep",
            //     [state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount],
            //     [state.sqrtPriceX96, useParams ? sqrtPriceLimitX96 : step.sqrtPriceNextX96, state.liquidity, state.amountSpecifiedRemaining, BigInt(pool.fee)]
            // );

            if (exactInput) {
                state.amountSpecifiedRemaining -= step.amountIn + step.feeAmount;
                state.amountCalculated -= step.amountOut;
            } else {
                state.amountSpecifiedRemaining += step.amountOut;
                state.amountCalculated += step.amountIn + step.feeAmount;
            }

            if (cache.feeProtocol > 0) {
                const delta = step.feeAmount / BigInt(cache.feeProtocol);
                step.feeAmount -= delta;
                state.protocolFee += delta;
            }

            if (state.liquidity > 0n) {
                state.feeGrowthGlobalX128 += FullMath.mulDiv(
                    step.feeAmount,
                    FixedPoint128.Q128,
                    state.liquidity
                );
            }

            if (state.sqrtPriceX96 === step.sqrtPriceNextX96) {
                if (step.initialized) {
                    if (!cache.computedLatestObservation) {
                        [cache.tickCumulative, cache.secondsPerLiquidityCumulativeX128] =
                            await this.observationStore.observeSingle(
                                this.poolId,
                                cache.blockTimestamp,
                                0n,
                                slot0Start.tick,
                                slot0Start.observationIndex,
                                cache.liquidityStart,
                                slot0Start.observationCardinality
                            );
                        cache.computedLatestObservation = true;
                    }

                    let liquidityNet = await this.tickInfoStore.cross(
                        this.poolId,
                        step.tickNext,
                        zeroForOne ? state.feeGrowthGlobalX128 : feeGrowthGlobal.feeGrowthGlobal0X128,
                        zeroForOne ? feeGrowthGlobal.feeGrowthGlobal1X128 : state.feeGrowthGlobalX128,
                        cache.secondsPerLiquidityCumulativeX128,
                        cache.tickCumulative,
                        cache.blockTimestamp
                    );

                    if (zeroForOne) liquidityNet = -liquidityNet;

                    state.liquidity = LiquidityMath.addDelta(state.liquidity, liquidityNet);
                }

                state.tick = zeroForOne ? step.tickNext - 1 : step.tickNext;
            } else if (state.sqrtPriceX96 !== step.sqrtPriceStartX96) {
                state.tick = TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
            }

            if (asr == 0n) {
                asr = state.amountSpecifiedRemaining;
            }
        }

        if (state.tick !== slot0Start.tick) {
            const [observationIndex, observationCardinality] = await this.observationStore.write(
                this.poolId,
                slot0Start.observationIndex,
                cache.blockTimestamp,
                slot0Start.tick,
                cache.liquidityStart,
                slot0Start.observationCardinality,
                slot0Start.observationCardinalityNext
            );

            slot0.sqrtPriceX96 = state.sqrtPriceX96;
            slot0.tick = state.tick;
            slot0.observationIndex = observationIndex;
            slot0.observationCardinality = observationCardinality;
            slot0.observationCardinalityNext = slot0Start.observationCardinalityNext;
            slot0.feeProtocol = slot0Start.feeProtocol;
            slot0.unlocked = true;

        } else {
            slot0.sqrtPriceX96 = state.sqrtPriceX96;
        }

        if (cache.liquidityStart !== state.liquidity) {
            pool.liquidity = state.liquidity;
        }


        if (zeroForOne) {
            feeGrowthGlobal.feeGrowthGlobal0X128 = state.feeGrowthGlobalX128;
            if (state.protocolFee > 0n) pool.protocol_fee_token0 += state.protocolFee;
        } else {
            feeGrowthGlobal.feeGrowthGlobal1X128 = state.feeGrowthGlobalX128;
            if (state.protocolFee > 0n) pool.protocol_fee_token1 += state.protocolFee;
        }

        const [amount0, amount1] = zeroForOne === exactInput
            ? [amountSpecified - state.amountSpecifiedRemaining, state.amountCalculated]
            : [state.amountCalculated, amountSpecified - state.amountSpecifiedRemaining];

        const router = new V3Router(this.store, this.token0, this.token1, recipient, this.blockTimestamp, this.blockNumber);
        await router.uniswapV3SwapCallback(amount0, amount1, data);

        // if (zeroForOne) {
        //     // if (amount1 < 0n) {
        //     //     await TransferHelper.safeTransfer(this.token1, recipient, BigInt.asUintN(256, -amount1));
        //     // }

        //     // const balance0Before = await this.balance0();
        //     // const callback = new ethers.Contract(ethers.getAddress(ethers.hexlify('0')), [
        //     //     'function uniswapV3SwapCallback(int256,int256,bytes)'
        //     // ]) as unknown as IUniswapV3SwapCallback;

        //     // await callback.uniswapV3SwapCallback(amount0, amount1, data);

        //     // if (balance0Before + BigInt.asUintN(256, amount0) > await this.balance0()) {
        //     //     throw new Error('IIA');
        //     // }
        // } else {
        //     // if (amount0 < 0n) {
        //     //     await TransferHelper.safeTransfer(this.token0, recipient, BigInt.asUintN(256, -amount0));
        //     // }

        //     // const balance1Before = await this.balance1();
        //     // const callback = new ethers.Contract(ethers.getAddress(ethers.hexlify('0')), [
        //     //     'function uniswapV3SwapCallback(int256,int256,bytes)'
        //     // ]) as unknown as IUniswapV3SwapCallback;

        //     // await callback.uniswapV3SwapCallback(amount0, amount1, data);

        //     // if (balance1Before + BigInt.asUintN(256, amount1) > await this.balance1()) {
        //     //     throw new Error('IIA');
        //     // }
        // }

        // Emit Swap event
        slot0.unlocked = true;
        await this.slotStore.save(slot0);
        await this.feeGrowthGlobalStore.save(feeGrowthGlobal, this.blockNumber, this.blockTimestamp);
        await this.poolStore.save(pool);
        return [amount0, amount1];
    }

    // public async flash(
    //     recipient: string,
    //     amount0: bigint,
    //     amount1: bigint,
    //     data: string
    // ): Promise<void> {
    //     if (this.liquidity <= 0n) throw new Error('L');

    //     const fee0 = FullMath.mulDivRoundingUp(amount0, BigInt(this.fee), 1000000n);
    //     const fee1 = FullMath.mulDivRoundingUp(amount1, BigInt(this.fee), 1000000n);

    //     // const balance0Before = await this.balance0();
    //     // const balance1Before = await this.balance1();

    //     // if (amount0 > 0n) await TransferHelper.safeTransfer(this.token0, recipient, amount0);
    //     // if (amount1 > 0n) await TransferHelper.safeTransfer(this.token1, recipient, amount1);

    //     // const callback = new ethers.Contract(ethers.getAddress(ethers.hexlify('0')), [
    //     //     'function uniswapV3FlashCallback(uint256,uint256,bytes)'
    //     // ]) as unknown as IUniswapV3FlashCallback;

    //     // await callback.uniswapV3FlashCallback(fee0, fee1, data);

    //     const balance0After = await this.balance0();
    //     const balance1After = await this.balance1();

    //     // if (balance0Before + fee0 > balance0After) throw new Error('F0');
    //     // if (balance1Before + fee1 > balance1After) throw new Error('F1');

    //     const paid0 = balance0After - balance0Before;
    //     const paid1 = balance1After - balance1Before;

    //     if (paid0 > 0n) {
    //         const feeProtocol0 = this.slot0.feeProtocol % 16;
    //         const fees0 = feeProtocol0 === 0 ? 0n : paid0 / BigInt(feeProtocol0);
    //         if (fees0 > 0n) this.protocolFees.token0 += fees0;
    //         this.feeGrowthGlobal0X128 += FullMath.mulDiv(
    //             paid0 - fees0,
    //             FixedPoint128.Q128,
    //             this.liquidity
    //         );
    //     }

    //     if (paid1 > 0n) {
    //         const feeProtocol1 = this.slot0.feeProtocol >> 4;
    //         const fees1 = feeProtocol1 === 0 ? 0n : paid1 / BigInt(feeProtocol1);
    //         if (fees1 > 0n) this.protocolFees.token1 += fees1;
    //         this.feeGrowthGlobal1X128 += FullMath.mulDiv(
    //             paid1 - fees1,
    //             FixedPoint128.Q128,
    //             this.liquidity
    //         );
    //     }

    //     // Emit Flash event
    // }

    public async setFeeProtocol(feeProtocol0: number, feeProtocol1: number): Promise<void> {
        const slot0 = await this.slotStore.get(this.poolId) || emptySlot(this.poolId);
        if (!slot0.unlocked) throw new Error('LOK');

        // const factory = new ethers.Contract(this.factory, [
        //     'function owner() view returns (address)'
        // ]) as unknown as IUniswapV3Factory;

        // if (ethers.getAddress(ethers.hexlify('0')) !== await factory.owner()) {
        //     throw new Error('Not factory owner');
        // }

        if (
            (feeProtocol0 !== 0 && (feeProtocol0 < 4 || feeProtocol0 > 10)) ||
            (feeProtocol1 !== 0 && (feeProtocol1 < 4 || feeProtocol1 > 10))
        ) {
            throw new Error('Invalid protocol fee');
        }

        slot0.unlocked = false;
        // const feeProtocolOld = slot0.feeProtocol;
        slot0.feeProtocol = feeProtocol0 + (feeProtocol1 << 4);
        slot0.unlocked = true;

        await this.slotStore.save(slot0);

        // Emit SetFeeProtocol event
    }

    public async collectProtocol(
        recipient: string,
        amount0Requested: bigint,
        amount1Requested: bigint
    ): Promise<[bigint, bigint]> {
        const slot0 = await this.slotStore.get(this.poolId) || emptySlot(this.poolId);
        if (!slot0.unlocked) throw new Error('LOK');
        const pool = await this.poolStore.getById(this.poolId);
        if (!pool) throw Error("collectProtocol: Pool not found");

        // const factory = new ethers.Contract(this.factory, [
        //     'function owner() view returns (address)'
        // ]) as unknown as IUniswapV3Factory;

        // if (ethers.getAddress(ethers.hexlify('0')) !== await factory.owner()) {
        //     throw new Error('Not factory owner');
        // }

        slot0.unlocked = false;

        let amount0 = amount0Requested > pool.protocol_fee_token0 ? pool.protocol_fee_token0 : amount0Requested;
        let amount1 = amount1Requested > pool.protocol_fee_token1 ? pool.protocol_fee_token1 : amount1Requested;

        // if (amount0 > 0n) {
        //     if (amount0 === this.protocolFees.token0) amount0--;
        //     this.protocolFees.token0 -= amount0;
        //     await TransferHelper.safeTransfer(this.token0, recipient, amount0);
        // }

        // if (amount1 > 0n) {
        //     if (amount1 === this.protocolFees.token1) amount1--;
        //     this.protocolFees.token1 -= amount1;
        //     await TransferHelper.safeTransfer(this.token1, recipient, amount1);
        // }

        slot0.unlocked = true;

        await this.slotStore.save(slot0);

        // Emit CollectProtocol event
        return [amount0, amount1];
    }
}