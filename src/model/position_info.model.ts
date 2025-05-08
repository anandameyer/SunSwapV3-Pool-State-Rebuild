import { BigIntColumn, Entity, Index, IntColumn, PrimaryColumn, StringColumn } from '@subsquid/typeorm-store';

@Entity("position_infos")
export class PositionInfo {
    constructor(props?: Partial<PositionInfo>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @StringColumn()
    @Index()
    owner!: string

    @StringColumn()
    @Index()
    poolId!: string

    @IntColumn()
    @Index()
    tickLower!: number

    @IntColumn()
    @Index()
    tickUpper!: number

    @BigIntColumn()
    liquidity!: bigint // uint128

    @BigIntColumn()
    feeGrowthInside0LastX128!: bigint // uint256

    @BigIntColumn()
    feeGrowthInside1LastX128!: bigint // uint256

    @BigIntColumn()
    tokensOwed0!: bigint // uint128

    @BigIntColumn()
    tokensOwed1!: bigint // uint128
}