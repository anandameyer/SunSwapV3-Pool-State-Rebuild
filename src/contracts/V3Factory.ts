import { Store } from '@subsquid/typeorm-store';
import { ethers } from 'ethers';
import { createPoolId } from '../libraries/Helpers';
import { Pool } from '../model';
import { FeeAmountStore } from '../store/FeeAmountStore';
import { PoolStore } from '../store/PoolStore';
import { tickSpacingToMaxLiquidityPerTick } from '../store/TickInfoStore';

export const FactoryAddress = '41C2708485c99cd8cF058dE1a9a7e3C2d8261a995C'.toLowerCase();

export class V3Factory {
    // public owner: string;

    // public feeAmountTickSpacing: Map<number, number> = new Map();
    // public getPool: Map<string, Map<string, Map<number, string>>> = new Map();
    // public allPools: string[] = [];
    private readonly feeAmountStore: FeeAmountStore;
    private readonly poolStore: PoolStore;
    private readonly owner: string;
    // private readonly chain: Chain;
    private readonly blockHeight: number;

    constructor(owner: string, store: Store, blockHeigth: number) {
        this.feeAmountStore = new FeeAmountStore(store);
        this.poolStore = new PoolStore(store);
        this.owner = owner;
        // this.chain = chain;
        this.blockHeight = blockHeigth;
    }

    private async setFeeAmount(fee: number, tickSpacing: number) {
        await this.feeAmountStore.save({ id: fee.toString(), fee, tickSpacing });
    }

    public async createPool(tokenA: string, tokenB: string, fee: number): Promise<string> {

        // Input validation
        if (tokenA === tokenB) {
            throw new Error('Identical tokens');
        }

        // Sort tokens
        const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase()
            ? [tokenA, tokenB]
            : [tokenB, tokenA];

        if (token0 === ethers.ZeroAddress) {
            throw new Error('createPool: Zero address');
        }

        const tickSpacing = await this.feeAmountStore.get(fee);
        if (!tickSpacing) {
            throw new Error(`createPool: Fee ${fee} amount not enabled`);
        }

        // Check if pool already exists
        // const existingPool = this.getPoolFromMapping(token0, token1, fee);
        const poolId = createPoolId(token0, token1, fee);
        const existingPool = await this.poolStore.getById(poolId);
        if (existingPool) throw new Error('createPool: Pool already exists');

        // Deploy new pool
        const poolAddress = await this.deploy(
            this.owner, // Using factory address as owner
            token0,
            token1,
            fee,
            tickSpacing.tickSpacing
        );

        // Update mappings
        // this.setPoolInMapping(token0, token1, fee, poolAddress);
        // this.setPoolInMapping(token1, token0, fee, poolAddress); // Reverse mapping
        // this.allPools.push(poolAddress);

        // this.emitEvent('PoolCreated', {
        //     token0,
        //     token1,
        //     fee,
        //     tickSpacing,
        //     pool: poolAddress,
        //     poolCount: this.allPools.length
        // });

        return poolAddress;
    }

    public async getPool(token0: string, token1: string, fee: number): Promise<Pool | undefined> {
        return await this.poolStore.getById(createPoolId(token0, token1, fee));
    }

    // public setOwner(newOwner: string): void {
    //     if (ethers.getAddress(this.owner) !== ethers.getAddress(this.getCurrentSender())) {
    //         throw new Error('Not owner');
    //     }

    //     const previousOwner = this.owner;
    //     this.owner = newOwner;
    //     this.emitEvent('OwnerChanged', { previousOwner, newOwner });
    // }

    public async enableFeeAmount(fee: number, tickSpacing: number): Promise<void> {
        // if (ethers.getAddress(this.owner) !== ethers.getAddress(this.getCurrentSender())) {
        //     throw new Error('Not owner');
        // }

        if (fee >= 1000000) {
            throw new Error('Fee too high');
        }

        if (tickSpacing <= 0 || tickSpacing >= 16384) {
            throw new Error('Invalid tick spacing');
        }

        const feeAmount = await this.feeAmountStore.get(fee);

        if (feeAmount) {
            throw new Error('Fee amount already enabled');
        }

        await this.setFeeAmount(fee, tickSpacing);
    }

    public async allPoolsLength(): Promise<number> {
        return (await this.poolStore.allPool()).length
    }

    // public getPairHash(): string {
    //     return ethers.keccak256(UniswapV3Pool.bytecode);
    // }

    public async deploy(factory: string, token0: string, token1: string, fee: number, tickSpacing: number): Promise<string> {

        // const key = ethers.keccak256(
        //     new TextEncoder().encode(
        //         `${token0.substring(2)}${token1.substring(2)}${fee.toString()}`
        //     )
        // );

        const poolId = createPoolId(token0, token1, fee);


        // const contract = new V3Factory({ _chain: this.chain, block: { height: this.blockHeight } }, FactoryAddress);

        // const poolAddress = await contract.getPool(token0, token1, fee);

        const pool: Pool = new Pool({
            id: poolId,
            // address: poolAddress,
            address: '',
            protocol_fee_token0: 0n,
            protocol_fee_token1: 0n,
            factory: factory,
            token0: token0,
            token1: token1,
            fee: fee,
            tickSpacing: tickSpacing,
            maxLiquidityPerTick: tickSpacingToMaxLiquidityPerTick(tickSpacing),
            liquidity: 0n,
            owner: this.owner,
        });

        await this.poolStore.save(pool);

        return poolId;
    }
}