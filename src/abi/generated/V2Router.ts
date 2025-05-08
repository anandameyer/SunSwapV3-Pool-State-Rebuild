import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const functions = {
    WETH: viewFun("0xad5c4648", "WETH()", {}, p.address),
    addLiquidity: fun("0xe8e33700", "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)", {"tokenA": p.address, "tokenB": p.address, "amountADesired": p.uint256, "amountBDesired": p.uint256, "amountAMin": p.uint256, "amountBMin": p.uint256, "to": p.address, "deadline": p.uint256}, {"amountA": p.uint256, "amountB": p.uint256, "liquidity": p.uint256}),
    addLiquidityETH: fun("0xf305d719", "addLiquidityETH(address,uint256,uint256,uint256,address,uint256)", {"token": p.address, "amountTokenDesired": p.uint256, "amountTokenMin": p.uint256, "amountETHMin": p.uint256, "to": p.address, "deadline": p.uint256}, {"amountToken": p.uint256, "amountETH": p.uint256, "liquidity": p.uint256}),
    factory: viewFun("0xc45a0155", "factory()", {}, p.address),
    getAmountIn: viewFun("0x85f8c259", "getAmountIn(uint256,uint256,uint256)", {"amountOut": p.uint256, "reserveIn": p.uint256, "reserveOut": p.uint256}, p.uint256),
    getAmountOut: viewFun("0x054d50d4", "getAmountOut(uint256,uint256,uint256)", {"amountIn": p.uint256, "reserveIn": p.uint256, "reserveOut": p.uint256}, p.uint256),
    getAmountsIn: viewFun("0x1f00ca74", "getAmountsIn(uint256,address[])", {"amountOut": p.uint256, "path": p.array(p.address)}, p.array(p.uint256)),
    getAmountsOut: viewFun("0xd06ca61f", "getAmountsOut(uint256,address[])", {"amountIn": p.uint256, "path": p.array(p.address)}, p.array(p.uint256)),
    getPairOffChain: viewFun("0x8d490350", "getPairOffChain(address,address)", {"tokenA": p.address, "tokenB": p.address}, p.address),
    quote: viewFun("0xad615dec", "quote(uint256,uint256,uint256)", {"amountA": p.uint256, "reserveA": p.uint256, "reserveB": p.uint256}, p.uint256),
    removeLiquidity: fun("0xbaa2abde", "removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)", {"tokenA": p.address, "tokenB": p.address, "liquidity": p.uint256, "amountAMin": p.uint256, "amountBMin": p.uint256, "to": p.address, "deadline": p.uint256}, {"amountA": p.uint256, "amountB": p.uint256}),
    removeLiquidityETH: fun("0x02751cec", "removeLiquidityETH(address,uint256,uint256,uint256,address,uint256)", {"token": p.address, "liquidity": p.uint256, "amountTokenMin": p.uint256, "amountETHMin": p.uint256, "to": p.address, "deadline": p.uint256}, {"amountToken": p.uint256, "amountETH": p.uint256}),
    removeLiquidityETHSupportingFeeOnTransferTokens: fun("0xaf2979eb", "removeLiquidityETHSupportingFeeOnTransferTokens(address,uint256,uint256,uint256,address,uint256)", {"token": p.address, "liquidity": p.uint256, "amountTokenMin": p.uint256, "amountETHMin": p.uint256, "to": p.address, "deadline": p.uint256}, p.uint256),
    removeLiquidityETHWithPermit: fun("0xded9382a", "removeLiquidityETHWithPermit(address,uint256,uint256,uint256,address,uint256,bool,uint8,bytes32,bytes32)", {"token": p.address, "liquidity": p.uint256, "amountTokenMin": p.uint256, "amountETHMin": p.uint256, "to": p.address, "deadline": p.uint256, "approveMax": p.bool, "v": p.uint8, "r": p.bytes32, "s": p.bytes32}, {"amountToken": p.uint256, "amountETH": p.uint256}),
    removeLiquidityETHWithPermitSupportingFeeOnTransferTokens: fun("0x5b0d5984", "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(address,uint256,uint256,uint256,address,uint256,bool,uint8,bytes32,bytes32)", {"token": p.address, "liquidity": p.uint256, "amountTokenMin": p.uint256, "amountETHMin": p.uint256, "to": p.address, "deadline": p.uint256, "approveMax": p.bool, "v": p.uint8, "r": p.bytes32, "s": p.bytes32}, p.uint256),
    removeLiquidityWithPermit: fun("0x2195995c", "removeLiquidityWithPermit(address,address,uint256,uint256,uint256,address,uint256,bool,uint8,bytes32,bytes32)", {"tokenA": p.address, "tokenB": p.address, "liquidity": p.uint256, "amountAMin": p.uint256, "amountBMin": p.uint256, "to": p.address, "deadline": p.uint256, "approveMax": p.bool, "v": p.uint8, "r": p.bytes32, "s": p.bytes32}, {"amountA": p.uint256, "amountB": p.uint256}),
    swapETHForExactTokens: fun("0xfb3bdb41", "swapETHForExactTokens(uint256,address[],address,uint256)", {"amountOut": p.uint256, "path": p.array(p.address), "to": p.address, "deadline": p.uint256}, p.array(p.uint256)),
    swapExactETHForTokens: fun("0x7ff36ab5", "swapExactETHForTokens(uint256,address[],address,uint256)", {"amountOutMin": p.uint256, "path": p.array(p.address), "to": p.address, "deadline": p.uint256}, p.array(p.uint256)),
    swapExactETHForTokensSupportingFeeOnTransferTokens: fun("0xb6f9de95", "swapExactETHForTokensSupportingFeeOnTransferTokens(uint256,address[],address,uint256)", {"amountOutMin": p.uint256, "path": p.array(p.address), "to": p.address, "deadline": p.uint256}, ),
    swapExactTokensForETH: fun("0x18cbafe5", "swapExactTokensForETH(uint256,uint256,address[],address,uint256)", {"amountIn": p.uint256, "amountOutMin": p.uint256, "path": p.array(p.address), "to": p.address, "deadline": p.uint256}, p.array(p.uint256)),
    swapExactTokensForETHSupportingFeeOnTransferTokens: fun("0x791ac947", "swapExactTokensForETHSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)", {"amountIn": p.uint256, "amountOutMin": p.uint256, "path": p.array(p.address), "to": p.address, "deadline": p.uint256}, ),
    swapExactTokensForTokens: fun("0x38ed1739", "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)", {"amountIn": p.uint256, "amountOutMin": p.uint256, "path": p.array(p.address), "to": p.address, "deadline": p.uint256}, p.array(p.uint256)),
    swapExactTokensForTokensSupportingFeeOnTransferTokens: fun("0x5c11d795", "swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)", {"amountIn": p.uint256, "amountOutMin": p.uint256, "path": p.array(p.address), "to": p.address, "deadline": p.uint256}, ),
    swapTokensForExactETH: fun("0x4a25d94a", "swapTokensForExactETH(uint256,uint256,address[],address,uint256)", {"amountOut": p.uint256, "amountInMax": p.uint256, "path": p.array(p.address), "to": p.address, "deadline": p.uint256}, p.array(p.uint256)),
    swapTokensForExactTokens: fun("0x8803dbee", "swapTokensForExactTokens(uint256,uint256,address[],address,uint256)", {"amountOut": p.uint256, "amountInMax": p.uint256, "path": p.array(p.address), "to": p.address, "deadline": p.uint256}, p.array(p.uint256)),
}

export class Contract extends ContractBase {

    WETH() {
        return this.eth_call(functions.WETH, {})
    }

    factory() {
        return this.eth_call(functions.factory, {})
    }

    getAmountIn(amountOut: GetAmountInParams["amountOut"], reserveIn: GetAmountInParams["reserveIn"], reserveOut: GetAmountInParams["reserveOut"]) {
        return this.eth_call(functions.getAmountIn, {amountOut, reserveIn, reserveOut})
    }

    getAmountOut(amountIn: GetAmountOutParams["amountIn"], reserveIn: GetAmountOutParams["reserveIn"], reserveOut: GetAmountOutParams["reserveOut"]) {
        return this.eth_call(functions.getAmountOut, {amountIn, reserveIn, reserveOut})
    }

    getAmountsIn(amountOut: GetAmountsInParams["amountOut"], path: GetAmountsInParams["path"]) {
        return this.eth_call(functions.getAmountsIn, {amountOut, path})
    }

    getAmountsOut(amountIn: GetAmountsOutParams["amountIn"], path: GetAmountsOutParams["path"]) {
        return this.eth_call(functions.getAmountsOut, {amountIn, path})
    }

    getPairOffChain(tokenA: GetPairOffChainParams["tokenA"], tokenB: GetPairOffChainParams["tokenB"]) {
        return this.eth_call(functions.getPairOffChain, {tokenA, tokenB})
    }

    quote(amountA: QuoteParams["amountA"], reserveA: QuoteParams["reserveA"], reserveB: QuoteParams["reserveB"]) {
        return this.eth_call(functions.quote, {amountA, reserveA, reserveB})
    }
}

/// Function types
export type WETHParams = FunctionArguments<typeof functions.WETH>
export type WETHReturn = FunctionReturn<typeof functions.WETH>

export type AddLiquidityParams = FunctionArguments<typeof functions.addLiquidity>
export type AddLiquidityReturn = FunctionReturn<typeof functions.addLiquidity>

export type AddLiquidityETHParams = FunctionArguments<typeof functions.addLiquidityETH>
export type AddLiquidityETHReturn = FunctionReturn<typeof functions.addLiquidityETH>

export type FactoryParams = FunctionArguments<typeof functions.factory>
export type FactoryReturn = FunctionReturn<typeof functions.factory>

export type GetAmountInParams = FunctionArguments<typeof functions.getAmountIn>
export type GetAmountInReturn = FunctionReturn<typeof functions.getAmountIn>

export type GetAmountOutParams = FunctionArguments<typeof functions.getAmountOut>
export type GetAmountOutReturn = FunctionReturn<typeof functions.getAmountOut>

export type GetAmountsInParams = FunctionArguments<typeof functions.getAmountsIn>
export type GetAmountsInReturn = FunctionReturn<typeof functions.getAmountsIn>

export type GetAmountsOutParams = FunctionArguments<typeof functions.getAmountsOut>
export type GetAmountsOutReturn = FunctionReturn<typeof functions.getAmountsOut>

export type GetPairOffChainParams = FunctionArguments<typeof functions.getPairOffChain>
export type GetPairOffChainReturn = FunctionReturn<typeof functions.getPairOffChain>

export type QuoteParams = FunctionArguments<typeof functions.quote>
export type QuoteReturn = FunctionReturn<typeof functions.quote>

export type RemoveLiquidityParams = FunctionArguments<typeof functions.removeLiquidity>
export type RemoveLiquidityReturn = FunctionReturn<typeof functions.removeLiquidity>

export type RemoveLiquidityETHParams = FunctionArguments<typeof functions.removeLiquidityETH>
export type RemoveLiquidityETHReturn = FunctionReturn<typeof functions.removeLiquidityETH>

export type RemoveLiquidityETHSupportingFeeOnTransferTokensParams = FunctionArguments<typeof functions.removeLiquidityETHSupportingFeeOnTransferTokens>
export type RemoveLiquidityETHSupportingFeeOnTransferTokensReturn = FunctionReturn<typeof functions.removeLiquidityETHSupportingFeeOnTransferTokens>

export type RemoveLiquidityETHWithPermitParams = FunctionArguments<typeof functions.removeLiquidityETHWithPermit>
export type RemoveLiquidityETHWithPermitReturn = FunctionReturn<typeof functions.removeLiquidityETHWithPermit>

export type RemoveLiquidityETHWithPermitSupportingFeeOnTransferTokensParams = FunctionArguments<typeof functions.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens>
export type RemoveLiquidityETHWithPermitSupportingFeeOnTransferTokensReturn = FunctionReturn<typeof functions.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens>

export type RemoveLiquidityWithPermitParams = FunctionArguments<typeof functions.removeLiquidityWithPermit>
export type RemoveLiquidityWithPermitReturn = FunctionReturn<typeof functions.removeLiquidityWithPermit>

export type SwapETHForExactTokensParams = FunctionArguments<typeof functions.swapETHForExactTokens>
export type SwapETHForExactTokensReturn = FunctionReturn<typeof functions.swapETHForExactTokens>

export type SwapExactETHForTokensParams = FunctionArguments<typeof functions.swapExactETHForTokens>
export type SwapExactETHForTokensReturn = FunctionReturn<typeof functions.swapExactETHForTokens>

export type SwapExactETHForTokensSupportingFeeOnTransferTokensParams = FunctionArguments<typeof functions.swapExactETHForTokensSupportingFeeOnTransferTokens>
export type SwapExactETHForTokensSupportingFeeOnTransferTokensReturn = FunctionReturn<typeof functions.swapExactETHForTokensSupportingFeeOnTransferTokens>

export type SwapExactTokensForETHParams = FunctionArguments<typeof functions.swapExactTokensForETH>
export type SwapExactTokensForETHReturn = FunctionReturn<typeof functions.swapExactTokensForETH>

export type SwapExactTokensForETHSupportingFeeOnTransferTokensParams = FunctionArguments<typeof functions.swapExactTokensForETHSupportingFeeOnTransferTokens>
export type SwapExactTokensForETHSupportingFeeOnTransferTokensReturn = FunctionReturn<typeof functions.swapExactTokensForETHSupportingFeeOnTransferTokens>

export type SwapExactTokensForTokensParams = FunctionArguments<typeof functions.swapExactTokensForTokens>
export type SwapExactTokensForTokensReturn = FunctionReturn<typeof functions.swapExactTokensForTokens>

export type SwapExactTokensForTokensSupportingFeeOnTransferTokensParams = FunctionArguments<typeof functions.swapExactTokensForTokensSupportingFeeOnTransferTokens>
export type SwapExactTokensForTokensSupportingFeeOnTransferTokensReturn = FunctionReturn<typeof functions.swapExactTokensForTokensSupportingFeeOnTransferTokens>

export type SwapTokensForExactETHParams = FunctionArguments<typeof functions.swapTokensForExactETH>
export type SwapTokensForExactETHReturn = FunctionReturn<typeof functions.swapTokensForExactETH>

export type SwapTokensForExactTokensParams = FunctionArguments<typeof functions.swapTokensForExactTokens>
export type SwapTokensForExactTokensReturn = FunctionReturn<typeof functions.swapTokensForExactTokens>

