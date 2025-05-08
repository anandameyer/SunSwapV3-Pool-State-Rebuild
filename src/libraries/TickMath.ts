export class TickMath {
    // Constants
    static readonly MIN_TICK = -887272;
    static readonly MAX_TICK = -this.MIN_TICK;
    static readonly MIN_SQRT_RATIO = 4295128739n;
    static readonly MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n;

    // Magic numbers for tick calculation
    static readonly MAGIC_NUMBERS = [
        0xfffcb933bd6fad37aa2d162d1a594001n,
        0xfff97272373d413259a46990580e213an,
        0xfff2e50f5f656932ef12357cf3c7fdccn,
        0xffe5caca7e10e4e61c3624eaa0941cd0n,
        0xffcb9843d60f6159c9db58835c926644n,
        0xff973b41fa98c081472e6896dfb254c0n,
        0xff2ea16466c96a3843ec78b326b52861n,
        0xfe5dee046a99a2a811c461f1969c3053n,
        0xfcbe86c7900a88aedcffc83b479aa3a4n,
        0xf987a7253ac413176f2b074cf7815e54n,
        0xf3392b0822b70005940c7a398e4b70f3n,
        0xe7159475a2c29b7443b29c7fa6e889d9n,
        0xd097f3bdfd2022b8845ad8f792aa5825n,
        0xa9f746462d870fdf8a65dc1f90e061e5n,
        0x70d869a156d2a1b890bb3df62baf32f7n,
        0x31be135f97d08fd981231505542fcfa6n,
        0x9aa508b5b7a84e1c677de54f3e99bc9n,
        0x5d6af8dedb81196699c329225ee604n,
        0x2216e584f5fa1ea926041bedfe98n,
        0x48a170391f7dc42444e8fa2n
    ];

    // Constants for getTickAtSqrtRatio
    static readonly LOG_SQRT_10001 = 255738958999603826347141n;
    static readonly TICK_LOW_CONST = 3402992956809132418596140100660247210n;
    static readonly TICK_HI_CONST = 291339464771989622907027621153398088495n;

    static getSqrtRatioAtTick(tick: number): bigint {
        const absTick = BigInt(tick < 0 ? -tick : tick);
        if (absTick > BigInt(this.MAX_TICK)) throw new Error('T');

        let ratio = (absTick & 1n) !== 0n ? this.MAGIC_NUMBERS[0] : 0x100000000000000000000000000000000n;

        for (let i = 1; i < 20; i++) {
            if ((absTick & (1n << BigInt(i))) !== 0n) {
                ratio = (ratio * this.MAGIC_NUMBERS[i]) >> 128n;
            }
        }

        if (tick > 0) ratio = (2n ** 256n - 1n) / ratio;

        const result = (ratio >> 32n) + (ratio % (1n << 32n) === 0n ? 0n : 1n);

        // console.log({ name: "getSqrtRatioAtTick", tick, result });

        // Round up when converting from Q128.128 to Q64.96
        return result;
    }

    static getTickAtSqrtRatio(sqrtPriceX96: bigint): number {
        if (sqrtPriceX96 < this.MIN_SQRT_RATIO || sqrtPriceX96 >= this.MAX_SQRT_RATIO) {
            throw new Error('R');
        }

        const ratio = sqrtPriceX96 << 32n;
        let r = ratio;
        let msb = 0n;

        // Find most significant bit
        {
            const f = r > 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn ? 1n << 7n : 0n;
            msb |= f;
            r = f !== 0n ? r >> f : r;
        }
        {
            const f = r > 0xFFFFFFFFFFFFFFFFn ? 1n << 6n : 0n;
            msb |= f;
            r = f !== 0n ? r >> f : r;
        }
        {
            const f = r > 0xFFFFFFFFn ? 1n << 5n : 0n;
            msb |= f;
            r = f !== 0n ? r >> f : r;
        }
        {
            const f = r > 0xFFFFn ? 1n << 4n : 0n;
            msb |= f;
            r = f !== 0n ? r >> f : r;
        }
        {
            const f = r > 0xFFn ? 1n << 3n : 0n;
            msb |= f;
            r = f !== 0n ? r >> f : r;
        }
        {
            const f = r > 0xFn ? 1n << 2n : 0n;
            msb |= f;
            r = f !== 0n ? r >> f : r;
        }
        {
            const f = r > 0x3n ? 1n << 1n : 0n;
            msb |= f;
            r = f !== 0n ? r >> f : r;
        }
        {
            const f = r > 0x1n ? 1n : 0n;
            msb |= f;
        }


        if (msb >= 128n) {
            r = ratio >> (msb - 127n);
        } else {
            r = ratio << (127n - msb);
        }

        let log_2 = (msb - 128n) << 64n;

        // Refine log_2 approximation
        for (let i = 63; i >= 50; i--) {
            r = (r * r) >> 127n;
            const f = r >> 128n;
            log_2 |= f << BigInt(i);
            r = r >> f;
        }

        const log_sqrt10001 = log_2 * this.LOG_SQRT_10001;

        const tickLow = Number((log_sqrt10001 - this.TICK_LOW_CONST) >> 128n);
        const tickHi = Number((log_sqrt10001 + this.TICK_HI_CONST) >> 128n);


        if (tickLow === tickHi) {
            // console.log({ name: "getTickAtSqrtRatio", sqrtPriceX96, tickLow });
            return tickLow;
        } else {
            const sqrtRatioAtTickHi = this.getSqrtRatioAtTick(tickHi);
            const result = sqrtRatioAtTickHi <= sqrtPriceX96 ? tickHi : tickLow;
            // console.log({ name: "getTickAtSqrtRatio", sqrtPriceX96, result });
            return result;
        }
    }
}