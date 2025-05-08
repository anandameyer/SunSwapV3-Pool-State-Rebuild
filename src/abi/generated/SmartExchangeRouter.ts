import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    AddPool: event("0x6e86bf8b3160887912efd862a21ae994c4afbdaa6411d7deb01b366363b0a48d", "AddPool(address,address,address[])", {"owner": indexed(p.address), "pool": indexed(p.address), "tokens": p.array(p.address)}),
    ChangePool: event("0x39ce084042993f76aca9103aa99f26d14bd1b9024f3300237c2eb1fec42e0ad3", "ChangePool(address,address,address[])", {"admin": indexed(p.address), "pool": indexed(p.address), "tokens": p.array(p.address)}),
    SwapExactETHForTokens: event("0x999469acd074431372a01bbdc2fd7bac546bf5fa4f606269e6771cc3d3a86746", "SwapExactETHForTokens(address,uint256,uint256[])", {"buyer": indexed(p.address), "amountIn": indexed(p.uint256), "amountsOut": p.array(p.uint256)}),
    SwapExactTokensForTokens: event("0xa3f636db0b76da13346d04e9a8970b81e1900067a475fea94400232d170f89c2", "SwapExactTokensForTokens(address,uint256,uint256[])", {"buyer": indexed(p.address), "amountIn": indexed(p.uint256), "amountsOut": p.array(p.uint256)}),
    TransferAdminship: event("0xda1479db09adf09e2dd03747e3d7dea3cc184ec803159d1b497455161c2ffc18", "TransferAdminship(address,address)", {"originOwner": indexed(p.address), "newOwner": indexed(p.address)}),
    TransferOwnership: event("0x5c486528ec3e3f0ea91181cff8116f02bfa350e03b8b6f12e00765adbb5af85c", "TransferOwnership(address,address)", {"originOwner": indexed(p.address), "newOwner": indexed(p.address)}),
}

export const functions = {
    WTRX: viewFun("0xe07094f3", "WTRX()", {}, p.address),
    addPool: fun("0xbaea7098", "addPool(string,address,address[])", {"poolVersion": p.string, "pool": p.address, "tokens": p.array(p.address)}, ),
    addPsmPool: fun("0x06266e9c", "addPsmPool(string,address,address,address[])", {"poolVersion": p.string, "pool": p.address, "gemJoin": p.address, "tokens": p.array(p.address)}, ),
    addUsdcPool: fun("0x402c5033", "addUsdcPool(string,address,address[])", {"poolVersion": p.string, "pool": p.address, "tokens": p.array(p.address)}, ),
    admin: viewFun("0xf851a440", "admin()", {}, p.address),
    changePool: fun("0x2d3ea5ab", "changePool(address,address[])", {"pool": p.address, "tokens": p.array(p.address)}, ),
    isPsmPool: viewFun("0x1824fd12", "isPsmPool(string)", {"poolVersion": p.string}, p.bool),
    isUsdcPool: viewFun("0xfa6240e1", "isUsdcPool(string)", {"poolVersion": p.string}, p.bool),
    owner: viewFun("0x8da5cb5b", "owner()", {}, p.address),
    psmUsdd: viewFun("0xb56f609f", "psmUsdd()", {}, p.address),
    retrieve: fun("0x28c4e24c", "retrieve(address,address,uint256)", {"token": p.address, "to": p.address, "amount": p.uint256}, ),
    swapExactInput: fun("0xcef95229", "swapExactInput(address[],string[],uint256[],uint24[],(uint256,uint256,address,uint256))", {"path": p.array(p.address), "poolVersion": p.array(p.string), "versionLen": p.array(p.uint256), "fees": p.array(p.uint24), "data": p.struct({"amountIn": p.uint256, "amountOutMin": p.uint256, "to": p.address, "deadline": p.uint256})}, p.array(p.uint256)),
    transferAdminship: fun("0x5be7cc16", "transferAdminship(address)", {"newAdmin": p.address}, ),
    transferOwnership: fun("0xf2fde38b", "transferOwnership(address)", {"newOwner": p.address}, ),
    unwrapWTRX: fun("0xd877b948", "unwrapWTRX(uint256,address)", {"amountMinimum": p.uint256, "recipient": p.address}, ),
    v1Factory: viewFun("0x8083f7bb", "v1Factory()", {}, p.address),
    v2Router: viewFun("0xdeadbc14", "v2Router()", {}, p.address),
    v3Router: viewFun("0x0dc91306", "v3Router()", {}, p.address),
}

export class Contract extends ContractBase {

    WTRX() {
        return this.eth_call(functions.WTRX, {})
    }

    admin() {
        return this.eth_call(functions.admin, {})
    }

    isPsmPool(poolVersion: IsPsmPoolParams["poolVersion"]) {
        return this.eth_call(functions.isPsmPool, {poolVersion})
    }

    isUsdcPool(poolVersion: IsUsdcPoolParams["poolVersion"]) {
        return this.eth_call(functions.isUsdcPool, {poolVersion})
    }

    owner() {
        return this.eth_call(functions.owner, {})
    }

    psmUsdd() {
        return this.eth_call(functions.psmUsdd, {})
    }

    v1Factory() {
        return this.eth_call(functions.v1Factory, {})
    }

    v2Router() {
        return this.eth_call(functions.v2Router, {})
    }

    v3Router() {
        return this.eth_call(functions.v3Router, {})
    }
}

/// Event types
export type AddPoolEventArgs = EParams<typeof events.AddPool>
export type ChangePoolEventArgs = EParams<typeof events.ChangePool>
export type SwapExactETHForTokensEventArgs = EParams<typeof events.SwapExactETHForTokens>
export type SwapExactTokensForTokensEventArgs = EParams<typeof events.SwapExactTokensForTokens>
export type TransferAdminshipEventArgs = EParams<typeof events.TransferAdminship>
export type TransferOwnershipEventArgs = EParams<typeof events.TransferOwnership>

/// Function types
export type WTRXParams = FunctionArguments<typeof functions.WTRX>
export type WTRXReturn = FunctionReturn<typeof functions.WTRX>

export type AddPoolParams = FunctionArguments<typeof functions.addPool>
export type AddPoolReturn = FunctionReturn<typeof functions.addPool>

export type AddPsmPoolParams = FunctionArguments<typeof functions.addPsmPool>
export type AddPsmPoolReturn = FunctionReturn<typeof functions.addPsmPool>

export type AddUsdcPoolParams = FunctionArguments<typeof functions.addUsdcPool>
export type AddUsdcPoolReturn = FunctionReturn<typeof functions.addUsdcPool>

export type AdminParams = FunctionArguments<typeof functions.admin>
export type AdminReturn = FunctionReturn<typeof functions.admin>

export type ChangePoolParams = FunctionArguments<typeof functions.changePool>
export type ChangePoolReturn = FunctionReturn<typeof functions.changePool>

export type IsPsmPoolParams = FunctionArguments<typeof functions.isPsmPool>
export type IsPsmPoolReturn = FunctionReturn<typeof functions.isPsmPool>

export type IsUsdcPoolParams = FunctionArguments<typeof functions.isUsdcPool>
export type IsUsdcPoolReturn = FunctionReturn<typeof functions.isUsdcPool>

export type OwnerParams = FunctionArguments<typeof functions.owner>
export type OwnerReturn = FunctionReturn<typeof functions.owner>

export type PsmUsddParams = FunctionArguments<typeof functions.psmUsdd>
export type PsmUsddReturn = FunctionReturn<typeof functions.psmUsdd>

export type RetrieveParams = FunctionArguments<typeof functions.retrieve>
export type RetrieveReturn = FunctionReturn<typeof functions.retrieve>

export type SwapExactInputParams = FunctionArguments<typeof functions.swapExactInput>
export type SwapExactInputReturn = FunctionReturn<typeof functions.swapExactInput>

export type TransferAdminshipParams = FunctionArguments<typeof functions.transferAdminship>
export type TransferAdminshipReturn = FunctionReturn<typeof functions.transferAdminship>

export type TransferOwnershipParams = FunctionArguments<typeof functions.transferOwnership>
export type TransferOwnershipReturn = FunctionReturn<typeof functions.transferOwnership>

export type UnwrapWTRXParams = FunctionArguments<typeof functions.unwrapWTRX>
export type UnwrapWTRXReturn = FunctionReturn<typeof functions.unwrapWTRX>

export type V1FactoryParams = FunctionArguments<typeof functions.v1Factory>
export type V1FactoryReturn = FunctionReturn<typeof functions.v1Factory>

export type V2RouterParams = FunctionArguments<typeof functions.v2Router>
export type V2RouterReturn = FunctionReturn<typeof functions.v2Router>

export type V3RouterParams = FunctionArguments<typeof functions.v3Router>
export type V3RouterReturn = FunctionReturn<typeof functions.v3Router>

