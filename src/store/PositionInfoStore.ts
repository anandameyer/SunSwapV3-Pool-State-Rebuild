import { Store } from "@subsquid/typeorm-store";
import { FixedPoint128 } from "../libraries/FixedPoint128";
import { FullMath } from "../libraries/FullMath";
import { createPositionInfoId } from "../libraries/Helpers";
import { LiquidityMath } from "../libraries/LiquidityMath";
import { PositionInfo } from "../model";


export class PositionInfoStore {
    private readonly store: Store;

    constructor(store: Store) {
        this.store = store;
    }

    /**
         * Returns the PositionInfo for a given owner and tick boundaries
         * @param owner Owner address as string
         * @param tickLower Lower tick boundary (number)
         * @param tickUpper Upper tick boundary (number)
         * @returns PositionInfo object
         */
    async get(
        poolId: string,
        owner: string,
        tickLower: number,
        tickUpper: number
    ): Promise<PositionInfo> {
        const id = createPositionInfoId(owner, tickLower, tickUpper);
        // const key = keccak256(new TextEncoder().encode(`${owner}-${tickLower}-${tickUpper}`));
        const position = await this.store.findOne(PositionInfo, { where: { poolId, owner, tickLower, tickUpper } });

        if (!position) {
            return new PositionInfo({
                id: id,
                owner: owner,
                liquidity: 0n,
                poolId,
                tickLower,
                tickUpper,
                feeGrowthInside0LastX128: 0n,
                feeGrowthInside1LastX128: 0n,
                tokensOwed0: 0n,
                tokensOwed1: 0n
            });
        }
        return position;
    }

    /**
     * Updates a position with new liquidity and fee information
     * @param self PositionInfo object to update
     * @param liquidityDelta Change in liquidity (bigint)
     * @param feeGrowthInside0X128 Fee growth for token0 (bigint)
     * @param feeGrowthInside1X128 Fee growth for token1 (bigint)
     * @returns Updated PositionInfo
     */
    async update(
        self: PositionInfo,
        liquidityDelta: bigint,
        feeGrowthInside0X128: bigint,
        feeGrowthInside1X128: bigint
    ): Promise<PositionInfo> {
        let liquidityNext: bigint;

        if (liquidityDelta === 0n) {
            if (self.liquidity === 0n) {
                throw new Error('NP'); // No position
            }
            liquidityNext = self.liquidity;
        } else {
            liquidityNext = LiquidityMath.addDelta(self.liquidity, liquidityDelta);
        }

        // Calculate accumulated fees
        const tokensOwed0 = FullMath.mulDiv(
            feeGrowthInside0X128 - self.feeGrowthInside0LastX128,
            self.liquidity,
            FixedPoint128.Q128
        );

        const tokensOwed1 = FullMath.mulDiv(
            feeGrowthInside1X128 - self.feeGrowthInside1LastX128,
            self.liquidity,
            FixedPoint128.Q128
        );

        self.liquidity = liquidityDelta !== 0n ? liquidityNext : self.liquidity;
        self.feeGrowthInside0LastX128 = feeGrowthInside0X128;
        self.feeGrowthInside1LastX128 = feeGrowthInside1X128;
        self.tokensOwed0 = self.tokensOwed0 + (tokensOwed0 > 0n ? tokensOwed0 : 0n);
        self.tokensOwed1 = self.tokensOwed1 + (tokensOwed1 > 0n ? tokensOwed1 : 0n);

        // console.dir(["position info update", self], { depth: null });
        await this.store.upsert(self);

        return self;
    }

    async save(self: PositionInfo) {
        console.log("position info save");
        await this.store.upsert(self);
    }
}