import { BigIntColumn, Entity, Index, IntColumn, PrimaryColumn, StringColumn } from '@subsquid/typeorm-store';

@Entity("pools")
export class Pool {
    constructor(props?: Partial<Pool>) {
        Object.assign(this, props)
    }

    @PrimaryColumn()
    id!: string

    @BigIntColumn({ default: 0n })
    protocol_fee_token0!: bigint

    @BigIntColumn({ default: 0n })
    protocol_fee_token1!: bigint

    @StringColumn()
    @Index()
    address!: string

    @StringColumn({ default: '' })
    factory!: string

    @StringColumn({ default: '' })
    @Index()
    owner!: string

    @StringColumn()
    @Index()
    token0!: string

    @StringColumn()
    @Index()
    token1!: string

    @IntColumn()
    @Index()
    fee!: number

    @IntColumn()
    @Index()
    tickSpacing!: number

    @BigIntColumn()
    maxLiquidityPerTick!: bigint

    @BigIntColumn()
    liquidity!: bigint;
}