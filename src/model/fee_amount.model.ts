import { Entity, Index, IntColumn, PrimaryColumn } from '@subsquid/typeorm-store';

@Entity("fee_amounts")
export class FeeAmount {
    constructor(props?: Partial<FeeAmount>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @IntColumn()
    @Index()
    fee!: number

    @IntColumn()
    tickSpacing!: number
}