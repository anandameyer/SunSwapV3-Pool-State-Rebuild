import { BigIntColumn, BooleanColumn, Entity, Index, PrimaryColumn, StringColumn } from '@subsquid/typeorm-store';

@Entity("tick_infos")
export class TickInfo {
    constructor(props?: Partial<TickInfo>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @StringColumn()
    @Index()
    poolId!: string

    @BigIntColumn()
    liquidityGross!: bigint; // uint128

    @BigIntColumn()
    liquidityNet!: bigint; // int128

    @BigIntColumn()
    feeGrowthOutside0X128!: bigint; // uint256

    @BigIntColumn()
    feeGrowthOutside1X128!: bigint; // uint256

    @BigIntColumn()
    tickCumulativeOutside!: bigint; // int56

    @BigIntColumn()
    secondsPerLiquidityOutsideX128!: bigint; // uint160

    @BigIntColumn()
    secondsOutside!: bigint; // uint32

    @BooleanColumn()
    initialized!: boolean;
}