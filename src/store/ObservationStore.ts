import { Store } from "@subsquid/typeorm-store";
import { Between } from "typeorm";
import { Observation } from "../model";


export class ObservationStore {
    private readonly store: Store;
    // private temporary : Map<number, Observation>

    constructor(store: Store) {
        this.store = store;
        // this.temporary = new(Map);
    }

    /**
     * Transforms a previous observation into a new observation
     * @param last The previous observation
     * @param blockTimestamp The new timestamp (uint32)
     * @param tick The current tick (int24)
     * @param liquidity The current liquidity (uint128)
     * @returns The new observation
     */
    transform(
        last: Observation,
        blockTimestamp: bigint,
        tick: number,
        liquidity: bigint
    ): Observation {
        const delta = blockTimestamp - last.blockTimestamp;
        const deltaBigInt = BigInt(delta);

        last.blockTimestamp = blockTimestamp;
        last.tickCumulative = last.tickCumulative + BigInt(tick) * deltaBigInt;
        last.secondsPerLiquidityCumulativeX128 =
            last.secondsPerLiquidityCumulativeX128 +
            ((deltaBigInt << 128n) / (liquidity > 0n ? liquidity : 1n));
        last.initialized = true;

        console.log("observation transform");
        return last;
    }

    /**
     * Initialize the oracle array
     * @param time The initialization time (uint32)
     * @returns cardinality and cardinalityNext (both uint16)
     */
    async initialize(poolId: string, time: bigint): Promise<[number, number]> {
        const obs: Observation = new Observation({
            id: `${poolId}-0`,
            index: 0,
            poolId: poolId,
            blockTimestamp: time,
            tickCumulative: 0n,
            secondsPerLiquidityCumulativeX128: 0n,
            initialized: true
        });
        console.log("observation initialize");
        await this.store.upsert(obs);
        return [1, 1];
    }

    /**
     * Writes an oracle observation to the array
     * @param index Current index (uint16)
     * @param blockTimestamp New timestamp (uint32)
     * @param tick Current tick (int24)
     * @param liquidity Current liquidity (uint128)
     * @param cardinality Current cardinality (uint16)
     * @param cardinalityNext Next cardinality (uint16)
     * @returns Updated index and cardinality (both uint16)
     */
    async write(
        poolId: string,
        index: number,
        blockTimestamp: bigint,
        tick: number,
        liquidity: bigint,
        cardinality: number,
        cardinalityNext: number
    ): Promise<[number, number]> {

        const last = await this.store.findOne(Observation, { where: { poolId, index } });

        if (!last) throw Error(`index ${index} not found`);

        // Early return if already written this block
        if (last.blockTimestamp === blockTimestamp) return [index, cardinality];

        // Update cardinality if conditions are right
        let cardinalityUpdated = cardinality;
        if (cardinalityNext > cardinality && index === (cardinality - 1)) {
            cardinalityUpdated = cardinalityNext;
        }

        const indexUpdated = (index + 1) % cardinalityUpdated;

        const obs = this.transform(last, blockTimestamp, tick, liquidity);
        obs.id = indexUpdated.toString();
        obs.index = indexUpdated;

        await this.store.upsert(obs);
        console.log("observation write");

        return [indexUpdated, cardinalityUpdated];
    }

    /**
     * Prepares the oracle array to store more observations
     * @param current Current cardinality (uint16)
     * @param next Proposed next cardinality (uint16)
     * @returns The new cardinality (uint16)
     */
    async grow(
        poolId: string,
        current: number,
        next: number
    ): Promise<number> {
        if (current <= 0) throw new Error('Invalid current cardinality');
        if (next <= current) return current;

        const observations: Observation[] = [];

        // Initialize new slots
        for (let i = current; i < next; i++) {
            observations[i] = {
                id: `${poolId}-${i}`,
                poolId: poolId,
                index: i,
                blockTimestamp: 1n,
                tickCumulative: 0n,
                secondsPerLiquidityCumulativeX128: 0n,
                initialized: false
            };
        }

        console.log("observation grow");
        await this.store.upsert(observations);

        return next;
    }

    /**
     * Binary search for observations around a target time
     * @param time Current time (uint32)
     * @param target Target time (uint32)
     * @param index Current index (uint16)
     * @param cardinality Current cardinality (uint16)
     * @returns Observations before/at and at/after target
     */
    async binarySearch(
        poolId: string,
        time: bigint,
        target: bigint,
        index: number,
        cardinality: number
    ): Promise<[Observation, Observation]> {
        let l = (index + 1) % cardinality; // oldest observation
        let r = l + cardinality - 1; // newest observation
        let i: number;
        let beforeOrAt: Observation;
        let atOrAfter: Observation;

        const observations = await this.store.findBy(Observation, { poolId, index: Between(l, r), initialized: true });

        while (true) {
            i = Math.floor((l + r) / 2);
            beforeOrAt = observations[i % cardinality];

            // Skip uninitialized observations
            if (!beforeOrAt.initialized) {
                l = i + 1;
                continue;
            }

            atOrAfter = observations[(i + 1) % cardinality];

            const targetAtOrAfter = lte(time, beforeOrAt.blockTimestamp, target);

            // Found the target
            if (targetAtOrAfter && lte(time, target, atOrAfter.blockTimestamp)) {
                break;
            }

            if (!targetAtOrAfter) {
                r = i - 1;
            } else {
                l = i + 1;
            }
        }

        return [beforeOrAt, atOrAfter];
    }

    /**
     * Gets observations surrounding a target time
     * @param time Current time (uint32)
     * @param target Target time (uint32)
     * @param tick Current tick (int24)
     * @param index Current index (uint16)
     * @param liquidity Current liquidity (uint128)
     * @param cardinality Current cardinality (uint16)
     * @returns Observations before/at and at/after target
     */
    async getSurroundingObservations(
        poolId: string,
        time: bigint,
        target: bigint,
        tick: number,
        index: number,
        liquidity: bigint,
        cardinality: number
    ): Promise<[Observation, Observation]> {
        // Start with newest observation
        let beforeOrAt = await this.store.findOne(Observation, { where: { poolId, index } });
        if (!beforeOrAt) throw Error(`index ${index} not found`);
        let atOrAfter: Observation = empty();

        // If target is at or after newest observation
        if (lte(time, beforeOrAt.blockTimestamp, target)) {
            if (beforeOrAt.blockTimestamp === target) {
                return [beforeOrAt, atOrAfter];
            } else {
                return [beforeOrAt, this.transform(beforeOrAt, target, tick, liquidity)];
            }
        }

        // Now check oldest observation
        beforeOrAt = await this.store.findOne(Observation, { where: { poolId, index: (index + 1) % cardinality } }) || empty();

        if (!beforeOrAt.initialized) beforeOrAt = await this.store.findOneBy(Observation, { id: '0' }) || empty();

        // Verify target is not before oldest observation
        if (!lte(time, beforeOrAt.blockTimestamp, target)) {
            throw new Error('OLD');
        }

        // Binary search if needed
        return this.binarySearch(poolId, time, target, index, cardinality);
    }

    /**
     * Gets accumulator values for a single time in the past
     * @param time Current time (uint32)
     * @param secondsAgo How far back to look (uint32)
     * @param tick Current tick (int24)
     * @param index Current index (uint16)
     * @param liquidity Current liquidity (uint128)
     * @param cardinality Current cardinality (uint16)
     * @returns tickCumulative and secondsPerLiquidityCumulativeX128
     */
    async observeSingle(
        poolId: string,
        time: bigint,
        secondsAgo: bigint,
        tick: number,
        index: number,
        liquidity: bigint,
        cardinality: number
    ): Promise<[bigint, bigint]> {
        if (secondsAgo === 0n) {
            let last = await this.store.findOne(Observation, { where: { poolId, index } });
            if (!last) throw Error(`index ${index} not found`);
            if (last.blockTimestamp !== time) {
                last = this.transform(last, time, tick, liquidity);
            }
            return [last.tickCumulative, last.secondsPerLiquidityCumulativeX128];
        }

        const target = BigInt(time - secondsAgo);
        const [beforeOrAt, atOrAfter] = await this.getSurroundingObservations(
            poolId,
            time,
            target,
            tick,
            index,
            liquidity,
            cardinality
        );

        if (target === beforeOrAt.blockTimestamp) {
            return [beforeOrAt.tickCumulative, beforeOrAt.secondsPerLiquidityCumulativeX128];
        } else if (target === atOrAfter.blockTimestamp) {
            return [atOrAfter.tickCumulative, atOrAfter.secondsPerLiquidityCumulativeX128];
        } else {
            // Interpolate between observations
            const observationTimeDelta = atOrAfter.blockTimestamp - beforeOrAt.blockTimestamp;
            const targetDelta = target - beforeOrAt.blockTimestamp;

            const tickCumulativeDelta = atOrAfter.tickCumulative - beforeOrAt.tickCumulative;
            const tickCumulative = beforeOrAt.tickCumulative +
                (tickCumulativeDelta * BigInt(targetDelta)) / BigInt(observationTimeDelta);

            const secondsPerLiquidityCumulativeX128Delta =
                atOrAfter.secondsPerLiquidityCumulativeX128 - beforeOrAt.secondsPerLiquidityCumulativeX128;
            const secondsPerLiquidityCumulativeX128 = beforeOrAt.secondsPerLiquidityCumulativeX128 +
                ((secondsPerLiquidityCumulativeX128Delta * BigInt(targetDelta)) / BigInt(observationTimeDelta));

            return [tickCumulative, secondsPerLiquidityCumulativeX128];
        }
    }

    /**
     * Gets accumulator values for multiple times in the past
     * @param time Current time (uint32)
     * @param secondsAgos Array of times to look back (uint32[])
     * @param tick Current tick (int24)
     * @param index Current index (uint16)
     * @param liquidity Current liquidity (uint128)
     * @param cardinality Current cardinality (uint16)
     * @returns Arrays of tickCumulative and secondsPerLiquidityCumulativeX128 values
     */
    async observe(
        poolId: string,
        time: bigint,
        secondsAgos: bigint[],
        tick: number,
        index: number,
        liquidity: bigint,
        cardinality: number
    ): Promise<[bigint[], bigint[]]> {
        if (cardinality <= 0) throw new Error('Invalid cardinality');

        const tickCumulatives: bigint[] = new Array(secondsAgos.length);
        const secondsPerLiquidityCumulativeX128s: bigint[] = new Array(secondsAgos.length);

        for (let i = 0; i < secondsAgos.length; i++) {
            [tickCumulatives[i], secondsPerLiquidityCumulativeX128s[i]] = await this.observeSingle(
                poolId,
                time,
                secondsAgos[i],
                tick,
                index,
                liquidity,
                cardinality
            );
        }

        return [tickCumulatives, secondsPerLiquidityCumulativeX128s];
    }
}

function empty(): Observation {
    return new Observation({
        id: '0',
        index: 0,
        blockTimestamp: 0n,
        tickCumulative: 0n,
        secondsPerLiquidityCumulativeX128: 0n,
        initialized: false
    })
}

/**
* Timestamp comparator (less than or equal)
* @param time Reference time (uint32)
* @param a First timestamp (uint32)
* @param b Second timestamp (uint32)
* @returns Whether a <= b
*/
function lte(
    time: bigint,
    a: bigint,
    b: bigint
): boolean {
    console.log("observation lte");
    // If no overflow, simple comparison
    if (a <= time && b <= time) return a <= b;

    // Adjust for overflow
    const aAdjusted = a > time ? a : a + (1n << 32n);
    const bAdjusted = b > time ? b : b + (1n << 32n);

    console.log("observation adjusted");
    return aAdjusted <= bAdjusted;
}