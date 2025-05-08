import { FixedPoint128 } from './FixedPoint128';
import { FullMath } from './FullMath';
import { createPositionInfoId } from './Helpers';
import { LiquidityMath } from './LiquidityMath';

export interface PositionInfo {
    liquidity: bigint; // uint128
    feeGrowthInside0LastX128: bigint; // uint256
    feeGrowthInside1LastX128: bigint; // uint256
    tokensOwed0: bigint; // uint128
    tokensOwed1: bigint; // uint128
}

export class Position {
    /**
     * Returns the PositionInfo for a given owner and tick boundaries
     * @param positionsMap Map containing all positions
     * @param owner Owner address as string
     * @param tickLower Lower tick boundary (number)
     * @param tickUpper Upper tick boundary (number)
     * @returns PositionInfo object
     */
    static get(
        positionsMap: Map<string, PositionInfo>,
        owner: string,
        tickLower: number,
        tickUpper: number
    ): PositionInfo {
        // const key = keccak256(new TextEncoder().encode(
        //     `${owner}${tickLower}${tickUpper}`
        // ));
        const id = createPositionInfoId(owner, tickLower, tickUpper);
        const position = positionsMap.get(id);

        if (!position) {
            return {
                liquidity: 0n,
                feeGrowthInside0LastX128: 0n,
                feeGrowthInside1LastX128: 0n,
                tokensOwed0: 0n,
                tokensOwed1: 0n
            };
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
    static update(
        self: PositionInfo,
        liquidityDelta: bigint,
        feeGrowthInside0X128: bigint,
        feeGrowthInside1X128: bigint
    ): PositionInfo {
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

        // Update position
        const updatedPosition: PositionInfo = {
            liquidity: liquidityDelta !== 0n ? liquidityNext : self.liquidity,
            feeGrowthInside0LastX128: feeGrowthInside0X128,
            feeGrowthInside1LastX128: feeGrowthInside1X128,
            tokensOwed0: self.tokensOwed0 + (tokensOwed0 > 0n ? tokensOwed0 : 0n),
            tokensOwed1: self.tokensOwed1 + (tokensOwed1 > 0n ? tokensOwed1 : 0n)
        };

        return updatedPosition;
    }
}