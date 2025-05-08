import { BigIntColumn, BooleanColumn, Entity, Index, IntColumn, PrimaryColumn, StringColumn } from '@subsquid/typeorm-store';

@Entity("observations")
export class Observation {
    constructor(props?: Partial<Observation>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @IntColumn()
    @Index()
    index!: number

    @StringColumn()
    @Index()
    poolId!: string

    @BigIntColumn()
    blockTimestamp!: bigint

    @BigIntColumn()
    tickCumulative!: bigint

    @BigIntColumn()
    secondsPerLiquidityCumulativeX128!: bigint

    @BooleanColumn()
    initialized!: boolean
}