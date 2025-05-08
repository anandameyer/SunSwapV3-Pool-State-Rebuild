import { BigIntColumn, Entity, Index, IntColumn, PrimaryColumn, StringColumn } from '@subsquid/typeorm-store';

@Entity("fee_growth_globals")
export class FeeGrowthGlobal {
    constructor(props?: Partial<FeeGrowthGlobal>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @IntColumn()
    revision!: number

    @StringColumn()
    @Index()
    poolId!: string

    @IntColumn()
    blockNumber!: number

    @BigIntColumn()
    timestamp!: number

    @BigIntColumn()
    feeGrowthGlobal0X128!: bigint;

    @BigIntColumn()
    feeGrowthGlobal1X128!: bigint;
}