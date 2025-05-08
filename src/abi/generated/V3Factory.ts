import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    FeeAmountEnabled: event("0xc66a3fdf07232cdd185febcc6579d408c241b47ae2f9907d84be655141eeaecc", "FeeAmountEnabled(uint24,int24)", {"fee": indexed(p.uint24), "tickSpacing": indexed(p.int24)}),
    OwnerChanged: event("0xb532073b38c83145e3e5135377a08bf9aab55bc0fd7c1179cd4fb995d2a5159c", "OwnerChanged(address,address)", {"oldOwner": indexed(p.address), "newOwner": indexed(p.address)}),
    PoolCreated: event("0x20a108faf9dc51ca2b459a109d08568e65a9cb87569b6b3a334c275d504ff94f", "PoolCreated(address,address,uint24,int24,address,uint256)", {"token0": indexed(p.address), "token1": indexed(p.address), "fee": indexed(p.uint24), "tickSpacing": p.int24, "pool": p.address, "poolLength": p.uint256}),
}

export const functions = {
    allPools: viewFun("0x41d1de97", "allPools(uint256)", {"_0": p.uint256}, p.address),
    feeAmountTickSpacing: viewFun("0x22afcccb", "feeAmountTickSpacing(uint24)", {"_0": p.uint24}, p.int24),
    getPool: viewFun("0x1698ee82", "getPool(address,address,uint24)", {"_0": p.address, "_1": p.address, "_2": p.uint24}, p.address),
    owner: viewFun("0x8da5cb5b", "owner()", {}, p.address),
    parameters: viewFun("0x89035730", "parameters()", {}, {"factory": p.address, "token0": p.address, "token1": p.address, "fee": p.uint24, "tickSpacing": p.int24}),
    createPool: fun("0xa1671295", "createPool(address,address,uint24)", {"tokenA": p.address, "tokenB": p.address, "fee": p.uint24}, p.address),
    setOwner: fun("0x13af4035", "setOwner(address)", {"_owner": p.address}, ),
    enableFeeAmount: fun("0x8a7c195f", "enableFeeAmount(uint24,int24)", {"fee": p.uint24, "tickSpacing": p.int24}, ),
    allPoolsLength: viewFun("0xefde4e64", "allPoolsLength()", {}, p.uint256),
    getPairHash: viewFun("0x79a3bc4e", "getPairHash()", {}, p.bytes32),
}

export class Contract extends ContractBase {

    allPools(_0: AllPoolsParams["_0"]) {
        return this.eth_call(functions.allPools, {_0})
    }

    feeAmountTickSpacing(_0: FeeAmountTickSpacingParams["_0"]) {
        return this.eth_call(functions.feeAmountTickSpacing, {_0})
    }

    getPool(_0: GetPoolParams["_0"], _1: GetPoolParams["_1"], _2: GetPoolParams["_2"]) {
        return this.eth_call(functions.getPool, {_0, _1, _2})
    }

    owner() {
        return this.eth_call(functions.owner, {})
    }

    parameters() {
        return this.eth_call(functions.parameters, {})
    }

    allPoolsLength() {
        return this.eth_call(functions.allPoolsLength, {})
    }

    getPairHash() {
        return this.eth_call(functions.getPairHash, {})
    }
}

/// Event types
export type FeeAmountEnabledEventArgs = EParams<typeof events.FeeAmountEnabled>
export type OwnerChangedEventArgs = EParams<typeof events.OwnerChanged>
export type PoolCreatedEventArgs = EParams<typeof events.PoolCreated>

/// Function types
export type AllPoolsParams = FunctionArguments<typeof functions.allPools>
export type AllPoolsReturn = FunctionReturn<typeof functions.allPools>

export type FeeAmountTickSpacingParams = FunctionArguments<typeof functions.feeAmountTickSpacing>
export type FeeAmountTickSpacingReturn = FunctionReturn<typeof functions.feeAmountTickSpacing>

export type GetPoolParams = FunctionArguments<typeof functions.getPool>
export type GetPoolReturn = FunctionReturn<typeof functions.getPool>

export type OwnerParams = FunctionArguments<typeof functions.owner>
export type OwnerReturn = FunctionReturn<typeof functions.owner>

export type ParametersParams = FunctionArguments<typeof functions.parameters>
export type ParametersReturn = FunctionReturn<typeof functions.parameters>

export type CreatePoolParams = FunctionArguments<typeof functions.createPool>
export type CreatePoolReturn = FunctionReturn<typeof functions.createPool>

export type SetOwnerParams = FunctionArguments<typeof functions.setOwner>
export type SetOwnerReturn = FunctionReturn<typeof functions.setOwner>

export type EnableFeeAmountParams = FunctionArguments<typeof functions.enableFeeAmount>
export type EnableFeeAmountReturn = FunctionReturn<typeof functions.enableFeeAmount>

export type AllPoolsLengthParams = FunctionArguments<typeof functions.allPoolsLength>
export type AllPoolsLengthReturn = FunctionReturn<typeof functions.allPoolsLength>

export type GetPairHashParams = FunctionArguments<typeof functions.getPairHash>
export type GetPairHashReturn = FunctionReturn<typeof functions.getPairHash>

