import { BigIntColumn, BooleanColumn, Entity, Index, IntColumn, PrimaryColumn, StringColumn } from '@subsquid/typeorm-store';

@Entity("positions")
export class Position {
    constructor(props?: Partial<Position>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @BigIntColumn()
    nonce!: bigint

    @StringColumn()
    operator!: string

    @StringColumn()
    @Index()
    owner!: string

    @BigIntColumn()
    @Index()
    tokenId!: bigint

    @IntColumn()
    @Index()
    tickLower!: number

    @IntColumn()
    @Index()
    tickUpper!: number

    @StringColumn()
    @Index()
    poolId!: string

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

    @BooleanColumn({ default: false })
    burned!: boolean
}