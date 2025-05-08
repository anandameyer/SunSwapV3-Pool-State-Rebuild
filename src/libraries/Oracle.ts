export type Observation = {
    blockTimestamp: number; // uint32 in Solidity
    tickCumulative: bigint; // int56 in Solidity
    secondsPerLiquidityCumulativeX128: bigint; // uint160 in Solidity
    initialized: boolean;
}

export class Oracle {
    static readonly MAX_OBSERVATIONS = 65535;

    /**
     * Transforms a previous observation into a new observation
     * @param last The previous observation
     * @param blockTimestamp The new timestamp (uint32)
     * @param tick The current tick (int24)
     * @param liquidity The current liquidity (uint128)
     * @returns The new observation
     */
    static transform(
        last: Observation,
        blockTimestamp: number,
        tick: number,
        liquidity: bigint
    ): Observation {
        const delta = blockTimestamp - last.blockTimestamp;
        const deltaBigInt = BigInt(delta);

        return {
            blockTimestamp,
            tickCumulative: last.tickCumulative + BigInt(tick) * deltaBigInt,
            secondsPerLiquidityCumulativeX128:
                last.secondsPerLiquidityCumulativeX128 +
                ((deltaBigInt << 128n) / (liquidity > 0n ? liquidity : 1n)),
            initialized: true
        };
    }

    /**
     * Initialize the oracle array
     * @param observations The observation array
     * @param time The initialization time (uint32)
     * @returns cardinality and cardinalityNext (both uint16)
     */
    static initialize(observations: Observation[], time: number): [number, number] {
        observations[0] = {
            blockTimestamp: time,
            tickCumulative: 0n,
            secondsPerLiquidityCumulativeX128: 0n,
            initialized: true
        };
        return [1, 1];
    }

    /**
     * Writes an oracle observation to the array
     * @param observations The observation array
     * @param index Current index (uint16)
     * @param blockTimestamp New timestamp (uint32)
     * @param tick Current tick (int24)
     * @param liquidity Current liquidity (uint128)
     * @param cardinality Current cardinality (uint16)
     * @param cardinalityNext Next cardinality (uint16)
     * @returns Updated index and cardinality (both uint16)
     */
    static write(
        observations: Observation[],
        index: number,
        blockTimestamp: number,
        tick: number,
        liquidity: bigint,
        cardinality: number,
        cardinalityNext: number
    ): [number, number] {
        const last = observations[index];

        // Early return if already written this block
        if (last.blockTimestamp === blockTimestamp) return [index, cardinality];

        // Update cardinality if conditions are right
        let cardinalityUpdated = cardinality;
        if (cardinalityNext > cardinality && index === (cardinality - 1)) {
            cardinalityUpdated = cardinalityNext;
        }

        const indexUpdated = (index + 1) % cardinalityUpdated;
        observations[indexUpdated] = this.transform(last, blockTimestamp, tick, liquidity);

        return [indexUpdated, cardinalityUpdated];
    }

    /**
     * Prepares the oracle array to store more observations
     * @param observations The observation array
     * @param current Current cardinality (uint16)
     * @param next Proposed next cardinality (uint16)
     * @returns The new cardinality (uint16)
     */
    static grow(
        observations: Observation[],
        current: number,
        next: number
    ): number {
        if (current <= 0) throw new Error('Invalid current cardinality');
        if (next <= current) return current;

        // Initialize new slots
        for (let i = current; i < next; i++) {
            observations[i] = {
                blockTimestamp: 1,
                tickCumulative: 0n,
                secondsPerLiquidityCumulativeX128: 0n,
                initialized: false
            };
        }

        return next;
    }

    /**
     * Timestamp comparator (less than or equal)
     * @param time Reference time (uint32)
     * @param a First timestamp (uint32)
     * @param b Second timestamp (uint32)
     * @returns Whether a <= b
     */
    static lte(
        time: number,
        a: number,
        b: number
    ): boolean {
        // If no overflow, simple comparison
        if (a <= time && b <= time) return a <= b;

        // Adjust for overflow
        const aAdjusted = a > time ? BigInt(a) : BigInt(a) + (1n << 32n);
        const bAdjusted = b > time ? BigInt(b) : BigInt(b) + (1n << 32n);

        return aAdjusted <= bAdjusted;
    }

    /**
     * Binary search for observations around a target time
     * @param observations The observation array
     * @param time Current time (uint32)
     * @param target Target time (uint32)
     * @param index Current index (uint16)
     * @param cardinality Current cardinality (uint16)
     * @returns Observations before/at and at/after target
     */
    static binarySearch(
        observations: Observation[],
        time: number,
        target: number,
        index: number,
        cardinality: number
    ): [Observation, Observation] {
        let l = (index + 1) % cardinality; // oldest observation
        let r = l + cardinality - 1; // newest observation
        let i: number;
        let beforeOrAt: Observation;
        let atOrAfter: Observation;

        while (true) {
            i = Math.floor((l + r) / 2);
            beforeOrAt = observations[i % cardinality];

            // Skip uninitialized observations
            if (!beforeOrAt.initialized) {
                l = i + 1;
                continue;
            }

            atOrAfter = observations[(i + 1) % cardinality];

            const targetAtOrAfter = this.lte(time, beforeOrAt.blockTimestamp, target);

            // Found the target
            if (targetAtOrAfter && this.lte(time, target, atOrAfter.blockTimestamp)) {
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
     * @param observations The observation array
     * @param time Current time (uint32)
     * @param target Target time (uint32)
     * @param tick Current tick (int24)
     * @param index Current index (uint16)
     * @param liquidity Current liquidity (uint128)
     * @param cardinality Current cardinality (uint16)
     * @returns Observations before/at and at/after target
     */
    static getSurroundingObservations(
        observations: Observation[],
        time: number,
        target: number,
        tick: number,
        index: number,
        liquidity: bigint,
        cardinality: number
    ): [Observation, Observation] {
        // Start with newest observation
        let beforeOrAt = observations[index];
        let atOrAfter: Observation = {
            blockTimestamp: 0,
            tickCumulative: 0n,
            secondsPerLiquidityCumulativeX128: 0n,
            initialized: false
        };

        // If target is at or after newest observation
        if (this.lte(time, beforeOrAt.blockTimestamp, target)) {
            if (beforeOrAt.blockTimestamp === target) {
                return [beforeOrAt, atOrAfter];
            } else {
                return [beforeOrAt, this.transform(beforeOrAt, target, tick, liquidity)];
            }
        }

        // Now check oldest observation
        beforeOrAt = observations[(index + 1) % cardinality];
        if (!beforeOrAt.initialized) beforeOrAt = observations[0];

        // Verify target is not before oldest observation
        if (!this.lte(time, beforeOrAt.blockTimestamp, target)) {
            throw new Error('OLD');
        }

        // Binary search if needed
        return this.binarySearch(observations, time, target, index, cardinality);
    }

    /**
     * Gets accumulator values for a single time in the past
     * @param observations The observation array
     * @param time Current time (uint32)
     * @param secondsAgo How far back to look (uint32)
     * @param tick Current tick (int24)
     * @param index Current index (uint16)
     * @param liquidity Current liquidity (uint128)
     * @param cardinality Current cardinality (uint16)
     * @returns tickCumulative and secondsPerLiquidityCumulativeX128
     */
    static observeSingle(
        observations: Observation[],
        time: number,
        secondsAgo: number,
        tick: number,
        index: number,
        liquidity: bigint,
        cardinality: number
    ): [bigint, bigint] {
        if (secondsAgo === 0) {
            let last = observations[index];
            if (last.blockTimestamp !== time) {
                last = this.transform(last, time, tick, liquidity);
            }
            return [last.tickCumulative, last.secondsPerLiquidityCumulativeX128];
        }

        const target = time - secondsAgo;
        const [beforeOrAt, atOrAfter] = this.getSurroundingObservations(
            observations,
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
     * @param observations The observation array
     * @param time Current time (uint32)
     * @param secondsAgos Array of times to look back (uint32[])
     * @param tick Current tick (int24)
     * @param index Current index (uint16)
     * @param liquidity Current liquidity (uint128)
     * @param cardinality Current cardinality (uint16)
     * @returns Arrays of tickCumulative and secondsPerLiquidityCumulativeX128 values
     */
    static observe(
        observations: Observation[],
        time: number,
        secondsAgos: number[],
        tick: number,
        index: number,
        liquidity: bigint,
        cardinality: number
    ): [bigint[], bigint[]] {
        if (cardinality <= 0) throw new Error('Invalid cardinality');

        const tickCumulatives: bigint[] = new Array(secondsAgos.length);
        const secondsPerLiquidityCumulativeX128s: bigint[] = new Array(secondsAgos.length);

        for (let i = 0; i < secondsAgos.length; i++) {
            [tickCumulatives[i], secondsPerLiquidityCumulativeX128s[i]] = this.observeSingle(
                observations,
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