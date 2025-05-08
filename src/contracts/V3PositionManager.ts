import { Store } from '@subsquid/typeorm-store';
import { ethers } from 'ethers';
import { FixedPoint128 } from '../libraries/FixedPoint128';
import { FullMath } from '../libraries/FullMath';
import { createPoolId } from '../libraries/Helpers';
import { LiquidityAmounts } from '../libraries/LiquidityAmounts';
import { TickMath } from '../libraries/TickMath';
import { Position } from '../model';
import { PoolStore } from '../store/PoolStore';
import { PositionStore } from '../store/PositionStore';
import { SlotStore } from '../store/SlotStore';
import { V3Factory } from './V3Factory';
import { V3Pool } from './V3Pool';

// interface Position {
//     nonce: bigint; // uint96
//     operator: string;
//     poolId: bigint; // uint80
//     tickLower: number; // int24
//     tickUpper: number; // int24
//     liquidity: bigint; // uint128
//     feeGrowthInside0LastX128: bigint; // uint256
//     feeGrowthInside1LastX128: bigint; // uint256
//     tokensOwed0: bigint; // uint128
//     tokensOwed1: bigint; // uint128
// }

export const PositionManagerAddress = '4172DB65b2e023E4783D46023e7135c692E527F6CB'.toLowerCase();

interface AddLiquidityParams {
    token0: string;
    token1: string;
    fee: number;
    recipient: string;
    tickLower: number;
    tickUpper: number;
    amount0Desired: bigint;
    amount1Desired: bigint;
    amount0Min: bigint;
    amount1Min: bigint;
    injectedLiquidity?: bigint;
}

interface MintParams {
    token0: string;
    token1: string;
    fee: number;
    tickLower: number;
    tickUpper: number;
    amount0Desired: bigint;
    amount1Desired: bigint;
    amount0Min: bigint;
    amount1Min: bigint;
    recipient: string;
    deadline: bigint;
    injectedLiquidity?: bigint;
}

interface IncreaseLiquidityParams {
    tokenId: bigint;
    amount0Desired: bigint;
    amount1Desired: bigint;
    amount0Min: bigint;
    amount1Min: bigint;
    deadline: bigint;
    injectedLiquidity?: bigint;
}

interface DecreaseLiquidityParams {
    tokenId: bigint;
    liquidity: bigint;
    amount0Min: bigint;
    amount1Min: bigint;
    deadline: bigint;
}

export class V3PositionManager {
    // private _poolIds: Map<string, bigint> = new Map(); // address => uint80
    // private _poolIdToPoolKey: Map<bigint, PoolKey> = new Map(); // uint80 => PoolKey
    // private _positions: Map<bigint, Position> = new Map(); // uint256 => Position
    // private _nextId: bigint = 1n; // uint176
    // private _nextPoolId: bigint = 1n; // uint80
    // private readonly _tokenDescriptor: string;
    private readonly store: Store;
    private readonly blockTimestamp: number;
    private readonly blockNumber: number;
    private readonly slotStore: SlotStore;
    private readonly positionStore: PositionStore;
    private readonly poolStore: PoolStore;
    private readonly sender: string;
    private readonly address: string = '0x' + PositionManagerAddress;
    // private readonly chain: Chain;

    // private readonly pool: Pool;

    constructor(store: Store, sender: string, blockTimestamp: number, blockNumber: number) {
        this.store = store;
        this.sender = sender;
        this.blockTimestamp = blockTimestamp;
        this.blockNumber = blockNumber;
        this.slotStore = new SlotStore(store);
        this.poolStore = new PoolStore(store);
        this.positionStore = new PositionStore(store);
        // this.chain = chain;

        // super('Sunswap V3 Positions NFT-V1', 'SUN-V3-POS', '1', factory, WETH9);
        // this._tokenDescriptor = tokenDescriptor;
        // this.pool = pool;
    }

    // public async positions(tokenId: bigint): Promise<{
    //     nonce: bigint;
    //     operator: string;
    //     token0: string;
    //     token1: string;
    //     fee: bigint;
    //     tickLower: number;
    //     tickUpper: number;
    //     liquidity: bigint;
    //     feeGrowthInside0LastX128: bigint;
    //     feeGrowthInside1LastX128: bigint;
    //     tokensOwed0: bigint;
    //     tokensOwed1: bigint;
    // }> {
    //     const position = this._positions.get(tokenId);
    //     if (!position || position.poolId === 0n) {
    //         throw new Error('Invalid token ID');
    //     }

    //     const poolKey = this._poolIdToPoolKey.get(position.poolId);
    //     if (!poolKey) {
    //         throw new Error('Pool not found');
    //     }

    //     return {
    //         nonce: position.nonce,
    //         operator: position.operator,
    //         token0: poolKey.token0,
    //         token1: poolKey.token1,
    //         fee: poolKey.fee,
    //         tickLower: position.tickLower,
    //         tickUpper: position.tickUpper,
    //         liquidity: position.liquidity,
    //         feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
    //         feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
    //         tokensOwed0: position.tokensOwed0,
    //         tokensOwed1: position.tokensOwed1
    //     };
    // }

    // private cachePoolKey(pool: string, poolKey: PoolKey): bigint {
    //     let poolId = this._poolIds.get(pool) || 0n;
    //     if (poolId === 0n) {
    //         poolId = this._nextPoolId++;
    //         this._poolIds.set(pool, poolId);
    //         this._poolIdToPoolKey.set(poolId, poolKey);
    //     }
    //     return poolId;
    // }

    /**
    * @notice Add liquidity to an initialized pool
    * @param params The parameters for adding liquidity
    * @returns liquidity The amount of liquidity minted
    * @returns amount0 The amount of token0 used
    * @returns amount1 The amount of token1 used
    * @returns pool The Uniswap V3 pool
    */
    public async addLiquidity(params: AddLiquidityParams): Promise<{
        liquidity: bigint;
        amount0: bigint;
        amount1: bigint;
        pool: V3Pool;
    }> {

        // const poolKey: PoolKey = {
        //     token0: params.token0,
        //     token1: params.token1,
        //     fee: params.fee
        // };

        // Compute pool address
        // const poolAddress = PoolAddress.computeAddress(this.factory, poolKey);
        // const pool = this.getPoolContract(poolAddress);

        const pool = new V3Pool(this.store, params.recipient, params.token0, params.token1, params.fee, this.blockTimestamp, this.blockNumber);
        const slot0 = await this.slotStore.get(pool.poolId);
        if (!slot0) throw new Error("addLiquidity: Slot0 not found");
        // Compute the liquidity amount
        // const slot0 = await pool.slot0();
        const sqrtPriceX96 = slot0.sqrtPriceX96;
        const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(params.tickLower);
        const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(params.tickUpper);

        let liquidity: bigint = params.injectedLiquidity ?? LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            params.amount0Desired,
            params.amount1Desired
        );

        // // Mint liquidity
        // const mintCallbackData: MintCallbackData = {
        //     poolKey,
        //     payer: this.msgSender()
        // };

        const [amount0, amount1] = await pool.mint(
            params.recipient,
            params.tickLower,
            params.tickUpper,
            liquidity,
            JSON.stringify(
                {
                    poolKey: {
                        token0: params.token0,
                        token1: params.token1,
                        fee: params.fee
                    },
                    payer: this.sender
                }),
        );

        // console.dir([amount0, params.amount0Min, amount1, params.amount1Min, pool.poolId, slot0], { depth: null });

        // // // Check for price slippage
        // const isAmount0Sufficient = amount0 >= params.amount0Min;
        // const isAmount1Sufficient = amount1 >= params.amount1Min;

        // if (!isAmount0Sufficient || !isAmount1Sufficient) {
        //     throw new Error('addLiquidity: Price slippage check');
        // }

        return {
            liquidity,
            amount0,
            amount1,
            pool
        };
    }

    public async mint(params: MintParams): Promise<{ tokenId: bigint; liquidity: bigint; amount0: bigint; amount1: bigint, id: string }> {
        // this.checkDeadline(params.deadline);

        const { liquidity, amount0, amount1, pool } = await this.addLiquidity({
            token0: params.token0,
            token1: params.token1,
            fee: params.fee,
            recipient: this.address,
            tickLower: params.tickLower,
            tickUpper: params.tickUpper,
            amount0Desired: params.amount0Desired,
            amount1Desired: params.amount1Desired,
            amount0Min: params.amount0Min,
            amount1Min: params.amount1Min,
            injectedLiquidity: params.injectedLiquidity,
        });

        const tokenId = 0n;

        // const tokenId = this._nextId++;
        // this._mint(params.recipient, tokenId);

        // const positionKey = createKey(PositionManagerAdress, params.tickLower, params.tickUpper);
        const { id, feeGrowthInside0LastX128, feeGrowthInside1LastX128 } = await pool.positionInfoStore.get(pool.poolId, this.address, params.tickLower, params.tickUpper);

        // await this.positionStore.save(position);

        // const poolId = this.cachePoolKey(
        //     pool.address,
        //     { token0: params.token0, token1: params.token1, fee: params.fee }
        //     // new PoolKey(params.token0, params.token1, params.fee)
        // );

        const position: Position = new Position({
            id,
            nonce: 0n,
            operator: ethers.ZeroAddress,
            poolId: pool.poolId,
            owner: params.recipient,
            tokenId,
            tickLower: params.tickLower,
            tickUpper: params.tickUpper,
            liquidity,
            feeGrowthInside0LastX128,
            feeGrowthInside1LastX128,
            tokensOwed0: 0n,
            tokensOwed1: 0n,
            burned: false,
        })

        await this.positionStore.save(position);

        // Emit IncreaseLiquidity event
        return { tokenId, liquidity, amount0, amount1, id };
    }

    // private isAuthorizedForToken(tokenId: bigint): boolean {
    //     return this._isApprovedOrOwner(this.msgSender(), tokenId);
    // }

    // public async tokenURI(tokenId: bigint): Promise<string> {
    //     if (!this._exists(tokenId)) {
    //         throw new Error('ERC721Metadata: URI query for nonexistent token');
    //     }

    //     // const descriptor = new ethers.Contract(
    //     //     this._tokenDescriptor,
    //     //     ['function tokenURI(address,uint256) view returns (string)'],
    //     //     this.provider
    //     // ) as unknown as INonfungibleTokenPositionDescriptor;

    //     return descriptor.tokenURI(this.address, tokenId);
    // }

    public async increaseLiquidity(params: IncreaseLiquidityParams): Promise<{ liquidity: bigint; amount0: bigint; amount1: bigint }> {
        // this.checkDeadline(params.deadline);

        const position = await this.positionStore.getByTokenId(params.tokenId);
        // if (!position) throw new Error('increaseLiquidity: Invalid token ID');
        if (!position) return { liquidity: 0n, amount0: 0n, amount1: 0n };

        const storedPool = await this.poolStore.getById(position.poolId);
        if (!storedPool) throw new Error('increaseLiquidity: Pool not found');

        // const poolKey =  this._poolIdToPoolKey.get(position.poolId);
        // if (!poolKey) {
        //     throw new Error('Pool not found');
        // }

        const { liquidity, amount0, amount1, pool } = await this.addLiquidity({
            token0: storedPool.token0,
            token1: storedPool.token1,
            fee: storedPool.fee,
            tickLower: position.tickLower,
            tickUpper: position.tickUpper,
            amount0Desired: params.amount0Desired,
            amount1Desired: params.amount1Desired,
            amount0Min: params.amount0Min,
            amount1Min: params.amount1Min,
            recipient: this.address,
            injectedLiquidity: params.injectedLiquidity,

        });

        // const positionKey = createKey(PositionManagerAdress, position.tickLower, position.tickUpper);
        // const { feeGrowthInside0LastX128, feeGrowthInside1LastX128 } = await pool.positions(positionKey);
        const { feeGrowthInside0LastX128, feeGrowthInside1LastX128 } = await pool.positionInfoStore.get(pool.poolId, this.address, position.tickLower, position.tickUpper);

        position.tokensOwed0 += FullMath.mulDiv(
            feeGrowthInside0LastX128 - position.feeGrowthInside0LastX128,
            position.liquidity,
            FixedPoint128.Q128
        );
        position.tokensOwed1 += FullMath.mulDiv(
            feeGrowthInside1LastX128 - position.feeGrowthInside1LastX128,
            position.liquidity,
            FixedPoint128.Q128
        );

        position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
        position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;
        position.liquidity += liquidity;

        await this.positionStore.save(position);

        // Emit IncreaseLiquidity event
        return { liquidity, amount0, amount1 };
    }

    public async decreaseLiquidity(params: DecreaseLiquidityParams): Promise<{ amount0: bigint; amount1: bigint, found: boolean }> {
        if (params.liquidity <= 0n) {
            throw new Error('Liquidity must be positive');
        }

        // if (!this.isAuthorizedForToken(params.tokenId)) {
        //     throw new Error('Not authorized');
        // }

        // this.checkDeadline(params.deadline);

        const position = await this.positionStore.getByTokenId(params.tokenId);
        // if (!position) throw new Error('decreaseLiquidity: Invalid token ID');
        if (!position) return { amount0: 0n, amount1: 0n, found: false };

        if (position.liquidity < params.liquidity) throw new Error('decreaseLiquidity: Insufficient liquidity');

        const storedPool = await this.poolStore.getById(position.poolId);
        if (!storedPool) throw Error("decreaseLiquidity: Pool not found")

        // const poolKey = this._poolIdToPoolKey.get(position.poolId);
        // if (!poolKey) {
        //     throw new Error('Pool not found');
        // }

        // const poolAddress = PoolAddress.computeAddress(this.factory, poolKey);
        // const pool = new ethers.Contract(
        //     poolAddress,
        //     ['function burn(int24,int24,uint128) returns (uint256,uint256)'],
        //     this.provider
        // ) as unknown as IUniswapV3Pool;

        const pool = new V3Pool(this.store, this.sender, storedPool.token0, storedPool.token1, storedPool.fee, this.blockTimestamp, this.blockNumber);

        const [amount0, amount1] = await pool.burn(position.tickLower, position.tickUpper, params.liquidity);

        if (amount0 < params.amount0Min || amount1 < params.amount1Min) {
            throw new Error('Price slippage check');
        }

        // const positionKey = createKey(PositionManagerAdress, position.tickLower, position.tickUpper);
        // const { feeGrowthInside0LastX128, feeGrowthInside1LastX128 } = await this.pool.positions(positionKey);
        const { feeGrowthInside0LastX128, feeGrowthInside1LastX128 } = await pool.positionInfoStore.get(pool.poolId, this.address, position.tickLower, position.tickUpper);

        position.tokensOwed0 += amount0 + FullMath.mulDiv(
            feeGrowthInside0LastX128 - position.feeGrowthInside0LastX128,
            position.liquidity,
            FixedPoint128.Q128
        );
        position.tokensOwed1 += amount1 + FullMath.mulDiv(
            feeGrowthInside1LastX128 - position.feeGrowthInside1LastX128,
            position.liquidity,
            FixedPoint128.Q128
        );

        position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
        position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;
        position.liquidity -= params.liquidity;

        await this.positionStore.save(position);

        // Emit DecreaseLiquidity event
        return { amount0, amount1, found: true };
    }

    public async collect(params: {
        tokenId: bigint;
        recipient: string;
        amount0Max: bigint;
        amount1Max: bigint;
    }): Promise<{ amount0: bigint; amount1: bigint, found: boolean }> {
        if (params.amount0Max <= 0n && params.amount1Max <= 0n) throw new Error('collect: Must collect at least one token');

        // if (!this.isAuthorizedForToken(params.tokenId)) {
        //     throw new Error('Not authorized');
        // }

        const recipient = params.recipient === ethers.ZeroAddress ? this.address : params.recipient;
        const position = await this.positionStore.getByTokenId(params.tokenId);
        // if (!position) throw new Error('collect: Invalid token ID');
        if (!position) return { amount0: 0n, amount1: 0n, found: false };
        // console.dir(["collect", params], { depth: null });

        const storedPool = await this.poolStore.getById(position.poolId);
        if (!storedPool) throw new Error("collect: Pool not found");

        // const poolKey = this._poolIdToPoolKey.get(position.poolId);
        // if (!poolKey) {
        //     throw new Error('Pool not found');
        // }

        // const poolAddress = PoolAddress.computeAddress(this.factory, poolKey);
        // const pool = new ethers.Contract(
        //     poolAddress,
        //     [
        //         'function burn(int24,int24,uint128)',
        //         'function collect(address,int24,int24,uint128,uint128) returns (uint128,uint128)'
        //     ],
        //     this.provider
        // ) as unknown as IUniswapV3Pool;

        const pool = new V3Pool(this.store, recipient, storedPool.token0, storedPool.token1, storedPool.fee, this.blockTimestamp, this.blockNumber);


        let tokensOwed0 = position.tokensOwed0;
        let tokensOwed1 = position.tokensOwed1;

        if (position.liquidity > 0n) {
            await pool.burn(position.tickLower, position.tickUpper, 0n);
            const { feeGrowthInside0LastX128, feeGrowthInside1LastX128 } = await pool.positionInfoStore.get(pool.poolId, this.address, position.tickLower, position.tickUpper);

            tokensOwed0 += FullMath.mulDiv(
                feeGrowthInside0LastX128 - position.feeGrowthInside0LastX128,
                position.liquidity,
                FixedPoint128.Q128
            );
            tokensOwed1 += FullMath.mulDiv(
                feeGrowthInside1LastX128 - position.feeGrowthInside1LastX128,
                position.liquidity,
                FixedPoint128.Q128
            );

            position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
            position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;
        }

        const amount0Collect = params.amount0Max > tokensOwed0 ? tokensOwed0 : params.amount0Max;
        const amount1Collect = params.amount1Max > tokensOwed1 ? tokensOwed1 : params.amount1Max;

        const [amount0, amount1] = await pool.collect(
            recipient,
            position.tickLower,
            position.tickUpper,
            amount0Collect,
            amount1Collect
        );

        position.tokensOwed0 = tokensOwed0 - amount0Collect;
        position.tokensOwed1 = tokensOwed1 - amount1Collect;

        await this.positionStore.save(position);

        // Emit Collect event
        return { amount0, amount1, found: true };
    }

    public async burn(tokenId: bigint): Promise<void> {
        // if (!this.isAuthorizedForToken(tokenId)) {
        //     throw new Error('Not authorized');
        // }

        const position = await this.positionStore.getByTokenId(tokenId);
        // if (!position) throw new Error('burn: Invalid token ID');
        if (!position) return;

        if (position.liquidity !== 0n || position.tokensOwed0 !== 0n || position.tokensOwed1 !== 0n) {
            throw new Error('Not cleared');
        }

        await this.positionStore.burn(tokenId);

        // this._positions.delete(tokenId);
        // this._burn(tokenId);
    }

    public async createAndInitializePoolIfNecessary(
        token0: string,
        token1: string,
        fee: number,
        sqrtPriceX96: bigint
    ): Promise<string> {
        // Validate token order (address comparison as hex strings)
        if (token0.toLowerCase() >= token1.toLowerCase()) {
            throw new Error('Token addresses must be in ascending order');
        }

        // Get the factory contract instance
        // const factoryContract = this.getUniswapV3FactoryContract();

        // Check if pool already exists
        const pool = await this.poolStore.getById(createPoolId(token0, token1, fee));
        // let poolAddress: string = '';

        if (!pool) {
            // Create new pool if it doesn't exist
            const factory = new V3Factory(this.sender, this.store, this.blockNumber)
            const poolAddress = await factory.createPool(token0, token1, fee);
            const poolContract = new V3Pool(this.store, this.sender, token0, token1, fee, this.blockTimestamp, this.blockNumber);


            // Initialize the new pool
            // const poolContract = this.getUniswapV3PoolContract(poolAddress);
            await poolContract.initialize(sqrtPriceX96);
            return poolAddress;
        }
        // Pool exists, check if it needs initialization
        // const poolContract = this.getUniswapV3PoolContract(poolAddress);
        const slot0 = await this.slotStore.get(pool.id);

        if (!slot0) {
            const poolContract = new V3Pool(this.store, this.sender, token0, token1, fee, this.blockTimestamp, this.blockNumber);
            await poolContract.initialize(sqrtPriceX96);
        }

        return pool.id;

        // const sqrtPriceX96Existing = slot0.sqrtPriceX96;

        // if (sqrtPriceX96Existing === BigInt(0)) {
        //     // Initialize existing but uninitialized pool
        //     await poolContract.initialize(sqrtPriceX96);
        // }
    }

    // protected _getAndIncrementNonce(tokenId: bigint): bigint {
    //     const position = this._positions.get(tokenId);
    //     if (!position) {
    //         throw new Error('Invalid token ID');
    //     }
    //     const nonce = position.nonce;
    //     position.nonce++;
    //     return nonce;
    // }

    // public getApproved(tokenId: bigint): string {
    //     if (!this._exists(tokenId)) {
    //         throw new Error('ERC721: approved query for nonexistent token');
    //     }
    //     const position = this._positions.get(tokenId);
    //     return position?.operator || ethers.ZeroAddress;
    // }

    // protected _approve(to: string, tokenId: bigint): void {
    //     const position = this._positions.get(tokenId);
    //     if (!position) {
    //         throw new Error('ERC721: approve for nonexistent token');
    //     }
    //     position.operator = to;
    //     // Emit Approval event
    // }
}

// function createKey(owner: string, tickLower: number, tickUpper: number): string {
//     return keccak256(new TextEncoder().encode(
//         `${owner}-${tickLower}-${tickUpper}`
//     ));
// }