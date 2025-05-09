import { BigIntColumn, Entity, Index, IntColumn, PrimaryColumn, StringColumn } from '@subsquid/typeorm-store';

@Entity("tick_bitmaps")
export class TickBitmap {
    constructor(props?: Partial<TickBitmap>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string
    
    @StringColumn()
    @Index()
    poolId!: string

    @IntColumn()
    @Index()
    tick!: number

    @IntColumn()
    tickSpacing!: number

    @BigIntColumn()
    value!: bigint
}