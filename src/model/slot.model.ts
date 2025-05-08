import { BigIntColumn, BooleanColumn, Entity, IntColumn, PrimaryColumn } from '@subsquid/typeorm-store';

@Entity("slots")
export class Slot {
    constructor(props?: Partial<Slot>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @BigIntColumn()
    sqrtPriceX96!: bigint

    @IntColumn()
    tick!: number

    @IntColumn()
    observationIndex!: number

    @IntColumn()
    observationCardinality!: number

    @IntColumn()
    observationCardinalityNext!: number

    @IntColumn()
    feeProtocol!: number

    @BooleanColumn()
    unlocked!: boolean;
}