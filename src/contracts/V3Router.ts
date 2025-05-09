import { Store } from '@subsquid/typeorm-store';
import { Path } from '../libraries/Path';
import { TickMath } from '../libraries/TickMath';
import { V3Pool } from './V3Pool';

export const RouterAddress = "419BC8fbecBa5D240b977B6fd4e9AC25B0012Ef843".toLowerCase();

interface SwapCallbackData {
    path: string;
    payer: string;
}

interface ExactInputSingleParams {
    tokenIn: string;
    tokenOut: string;
    fee: number;
    recipient: string;
    deadline: bigint;
    amountIn: bigint;
    amountOutMinimum: bigint;
    sqrtPriceLimitX96: bigint;
}

interface ExactInputParams {
    path: string;
    recipient: string;
    deadline: bigint;
    amountIn: bigint;
    amountOutMinimum: bigint;
}

interface ExactOutputSingleParams {
    tokenIn: string;
    tokenOut: string;
    fee: number;
    recipient: string;
    deadline: bigint;
    amountOut: bigint;
    amountInMaximum: bigint;
    sqrtPriceLimitX96: bigint;
}

interface ExactOutputParams {
    path: string;
    recipient: string;
    deadline: bigint;
    amountOut: bigint;
    amountInMaximum: bigint;
}

export class V3Router {
    private static readonly DEFAULT_AMOUNT_IN_CACHED = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // type(uint256).max
    private amountInCached: bigint = BigInt(V3Router.DEFAULT_AMOUNT_IN_CACHED);
    // private readonly address: string;
    // private readonly pool: Pool;
    private readonly store: Store;
    private readonly blockTimestamp: number;
    private readonly blockNumber: number;
    private readonly sender: string;
    private readonly token0: string;
    private readonly token1: string;
    private readonly pairAB: string;
    private readonly pairBA: string;


    constructor(store: Store, token0: string, token1: string, sender: string, blockTimestamp: number, blockNumber: number) {
        // this.address = msg.sender;
        this.store = store;
        this.blockTimestamp = blockTimestamp;
        this.blockNumber = blockNumber;
        this.sender = sender;
        this.token0 = token0;
        this.token1 = token1;
        this.pairAB = token0 + token1;
        this.pairBA = token1 + token0;
        // this.pool = new Pool(store, tickSpacing, fee, blockTimestamp, blockNumber);
    }

    // private async getPool(tokenA: string, tokenB: string, fee: number,): Promise<Pool> {
    //     return new Pool(this.store, tokenA, tokenB, fee, this.blockTimestamp, this.blockNumber);
    // }

    public async uniswapV3SwapCallback(amount0Delta: bigint, amount1Delta: bigint, _data: string): Promise<void> {
        // if (amount0Delta > 0 || amount1Delta > 0) {
        //     throw new Error('Swaps entirely within 0-liquidity regions are not supported');
        // }

        const data: SwapCallbackData = JSON.parse(_data);
        const { tokenA, tokenB, fee } = Path.decodeFirstPool(data.path);

        // console.dir(["uniswapV3SwapCallback", { tokenA, tokenB, fee, amount0Delta, amount1Delta }]);

        // CallbackValidation.verifyCallback(this.factory, tokenIn, tokenOut, fee);



        // (bool isExactInput, uint256 amountToPay) =
        // amount0Delta > 0
        //     ? (tokenIn < tokenOut, uint256(amount0Delta))
        //     : (tokenOut < tokenIn, uint256(amount1Delta));

        const isExactInput = amount0Delta > 0 ? tokenA < tokenB : tokenB < tokenA;
        const amountToPay = amount0Delta > 0 ? amount0Delta : amount1Delta;

        if (isExactInput) {
            //   this.pay(tokenIn, data.payer, msg.sender, amountToPay);
        } else {
            if (Path.hasMultiplePools(data.path)) {
                const newPath = Path.skipToken(data.path);
                await this.exactOutputInternal(amountToPay, this.sender, 0n, { path: newPath, payer: data.payer });
            } else {
                // this.amountInCached = amountToPay;
                // this.pay(tokenOut, data.payer, msg.sender, amountToPay);
            }
        }
    }

    private allowedToken(token0: string, token1: string): boolean {
        if (this.token0 == '' && this.token1 == '') return true;
        const tokens = (token0 + token1).toLowerCase()
        return tokens == this.pairAB || tokens == this.pairBA;
    }

    private async exactInputInternal(
        amountIn: bigint,
        recipient: string,
        sqrtPriceLimitX96: bigint,
        data: SwapCallbackData
    ): Promise<bigint> {
        // if (recipient === '0x0000000000000000000000000000000000000000') {
        //   recipient = this.address;
        // }

        // console.dir(["exactInputInternal", { amountIn, recipient, sqrtPriceLimitX96, data }], { depth: null });

        const { tokenA, tokenB, fee } = Path.decodeFirstPool(data.path);
        // console.dir(["exactInputInternal.decodeFirstPool", { tokenA, tokenB, fee }], { depth: null });
        const zeroForOne = tokenA < tokenB;

        // const pool = this.getPool(tokenA, tokenB, BigInt(fee));
        const sqrtPriceLimit = sqrtPriceLimitX96 === 0n
            ? (zeroForOne ? TickMath.MIN_SQRT_RATIO + 1n : TickMath.MAX_SQRT_RATIO - 1n)
            : sqrtPriceLimitX96;

        const pool = new V3Pool(this.store, RouterAddress, tokenA, tokenB, parseInt(fee), this.blockTimestamp, this.blockNumber);

        const [amount0, amount1] = await pool.swap(
            recipient,
            zeroForOne,
            amountIn,
            sqrtPriceLimit,
            JSON.stringify(data)
        );

        // console.dir(["exactInputInternal.swap", { zeroForOne, sqrtPriceLimit, fee, amount0, amount1 }], { depth: null });

        return zeroForOne ? -amount1 : -amount0

        // return zeroForOne ? this.negate(amount1) : this.negate(amount0);
    }

    public async exactInputSingle(params: ExactInputSingleParams): Promise<bigint> {
        // this.checkDeadline(params.deadline);

        if (!this.allowedToken(params.tokenIn, params.tokenOut)) return 0n;

        // console.dir(["exactInputSingle", params], { depth: null });

        const amountOut = await this.exactInputInternal(
            params.amountIn,
            params.recipient,
            params.sqrtPriceLimitX96,
            {
                path: Path.encode(params.tokenIn, params.fee.toString(), params.tokenOut),
                // payer: msg.sender
                payer: RouterAddress
            }
        );



        if (amountOut < params.amountOutMinimum) throw new Error('Too little received');

        return amountOut;
    }

    public async exactInput(params: ExactInputParams): Promise<bigint> {
        // this.checkDeadline(params.deadline);

        // console.dir(["exactInput", params], { depth: null });

        // let payer = msg.sender;
        let payer = RouterAddress;
        let currentPath = params.path;
        let amountIn = params.amountIn;
        let amountOut = 0n;

        while (true) {
            const hasMultiplePools = Path.hasMultiplePools(currentPath);

            amountIn = await this.exactInputInternal(
                amountIn,
                hasMultiplePools ? RouterAddress : params.recipient,
                0n,
                {
                    path: Path.getFirstPool(currentPath),
                    payer: payer
                }
            );

            if (hasMultiplePools) {
                payer = RouterAddress;
                currentPath = Path.skipToken(currentPath);
            } else {
                amountOut = amountIn;
                break;
            }
        }

        if (amountOut < params.amountOutMinimum) throw new Error('Too little received');

        return amountOut;
    }

    private async exactOutputInternal(
        amountOut: bigint,
        recipient: string,
        sqrtPriceLimitX96: bigint,
        data: SwapCallbackData
    ): Promise<bigint> {
        // if (recipient === '0x0000000000000000000000000000000000000000') {
        //     recipient = this.address;
        // }

        const { tokenA, tokenB, fee } = Path.decodeFirstPool(data.path);
        const zeroForOne = tokenA < tokenB;

        // console.dir(["exactOutputInternal.decodeFirstPool", { tokenA, tokenB, fee }], { depth: null });

        const pool = new V3Pool(this.store, RouterAddress, tokenA, tokenB, parseInt(fee), this.blockTimestamp, this.blockNumber);

        // const pool = this.getPool(tokenA, tokenB, BigInt(fee));
        const sqrtPriceLimit = sqrtPriceLimitX96 === 0n
            ? (zeroForOne ? TickMath.MIN_SQRT_RATIO + 1n : TickMath.MAX_SQRT_RATIO - 1n)
            : sqrtPriceLimitX96;

        const [amount0Delta, amount1Delta] = await pool.swap(
            recipient,
            zeroForOne,
            -amountOut,
            sqrtPriceLimit,
            JSON.stringify(data)
        );

        let amountIn: bigint;
        let amountOutReceived: bigint;

        if (zeroForOne) {
            amountIn = amount0Delta;
            amountOutReceived = -amount1Delta;
        } else {
            amountIn = amount1Delta;
            amountOutReceived = -amount0Delta;
        }

        if (sqrtPriceLimitX96 === 0n && amountOutReceived !== amountOut) {
            throw new Error('Did not receive full output amount');
        }

        return amountIn;
    }

    public async exactOutputSingle(params: ExactOutputSingleParams): Promise<bigint> {
        // this.checkDeadline(params.deadline);
        if (!this.allowedToken(params.tokenIn, params.tokenOut)) return 0n;
        // console.dir(["exactOutput", params], { depth: null });

        const amountIn = await this.exactOutputInternal(
            params.amountOut,
            params.recipient,
            params.sqrtPriceLimitX96,
            {
                path: Path.encode(params.tokenOut, params.fee.toString(), params.tokenIn),
                // payer: msg.sender
                payer: RouterAddress
            }
        );

        if (amountIn <= params.amountInMaximum) {
            throw new Error('Too much requested');
        }

        this.amountInCached = BigInt(V3Router.DEFAULT_AMOUNT_IN_CACHED);
        return amountIn;
    }

    public async exactOutput(params: ExactOutputParams): Promise<bigint> {
        // this.checkDeadline(params.deadline);

        // console.dir(["exactOutput", params], { depth: null });

        await this.exactOutputInternal(
            params.amountOut,
            params.recipient,
            0n,
            {
                path: params.path,
                // payer: msg.sender
                payer: RouterAddress
            }
        );

        const amountIn = this.amountInCached;
        if (amountIn <= params.amountInMaximum) {
            throw new Error('Too much requested');
        }

        this.amountInCached = BigInt(V3Router.DEFAULT_AMOUNT_IN_CACHED);
        return amountIn;
    }
}