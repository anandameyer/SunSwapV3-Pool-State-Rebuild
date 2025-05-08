import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const functions = {
    WETH9: viewFun("0x4aa4a4fc", "WETH9()", {}, p.address),
    factory: viewFun("0xc45a0155", "factory()", {}, p.address),
    multicall: fun("0xac9650d8", "multicall(bytes[])", {"data": p.array(p.bytes)}, p.array(p.bytes)),
    refundETH: fun("0x12210e8a", "refundETH()", {}, ),
    selfPermit: fun("0xf3995c67", "selfPermit(address,uint256,uint256,uint8,bytes32,bytes32)", {"token": p.address, "value": p.uint256, "deadline": p.uint256, "v": p.uint8, "r": p.bytes32, "s": p.bytes32}, ),
    selfPermitAllowed: fun("0x4659a494", "selfPermitAllowed(address,uint256,uint256,uint8,bytes32,bytes32)", {"token": p.address, "nonce": p.uint256, "expiry": p.uint256, "v": p.uint8, "r": p.bytes32, "s": p.bytes32}, ),
    selfPermitAllowedIfNecessary: fun("0xa4a78f0c", "selfPermitAllowedIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)", {"token": p.address, "nonce": p.uint256, "expiry": p.uint256, "v": p.uint8, "r": p.bytes32, "s": p.bytes32}, ),
    selfPermitIfNecessary: fun("0xc2e3140a", "selfPermitIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)", {"token": p.address, "value": p.uint256, "deadline": p.uint256, "v": p.uint8, "r": p.bytes32, "s": p.bytes32}, ),
    sweepToken: fun("0xdf2ab5bb", "sweepToken(address,uint256,address)", {"token": p.address, "amountMinimum": p.uint256, "recipient": p.address}, ),
    sweepTokenWithFee: fun("0xe0e189a0", "sweepTokenWithFee(address,uint256,address,uint256,address)", {"token": p.address, "amountMinimum": p.uint256, "recipient": p.address, "feeBips": p.uint256, "feeRecipient": p.address}, ),
    unwrapWETH9: fun("0x49404b7c", "unwrapWETH9(uint256,address)", {"amountMinimum": p.uint256, "recipient": p.address}, ),
    unwrapWETH9WithFee: fun("0x9b2c0a37", "unwrapWETH9WithFee(uint256,address,uint256,address)", {"amountMinimum": p.uint256, "recipient": p.address, "feeBips": p.uint256, "feeRecipient": p.address}, ),
    uniswapV3SwapCallback: fun("0xfa461e33", "uniswapV3SwapCallback(int256,int256,bytes)", {"amount0Delta": p.int256, "amount1Delta": p.int256, "_data": p.bytes}, ),
    exactInputSingle: fun("0x414bf389", "exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))", {"params": p.struct({"tokenIn": p.address, "tokenOut": p.address, "fee": p.uint24, "recipient": p.address, "deadline": p.uint256, "amountIn": p.uint256, "amountOutMinimum": p.uint256, "sqrtPriceLimitX96": p.uint160})}, p.uint256),
    exactInput: fun("0xc04b8d59", "exactInput((bytes,address,uint256,uint256,uint256))", {"params": p.struct({"path": p.bytes, "recipient": p.address, "deadline": p.uint256, "amountIn": p.uint256, "amountOutMinimum": p.uint256})}, p.uint256),
    exactOutputSingle: fun("0xdb3e2198", "exactOutputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))", {"params": p.struct({"tokenIn": p.address, "tokenOut": p.address, "fee": p.uint24, "recipient": p.address, "deadline": p.uint256, "amountOut": p.uint256, "amountInMaximum": p.uint256, "sqrtPriceLimitX96": p.uint160})}, p.uint256),
    exactOutput: fun("0xf28c0498", "exactOutput((bytes,address,uint256,uint256,uint256))", {"params": p.struct({"path": p.bytes, "recipient": p.address, "deadline": p.uint256, "amountOut": p.uint256, "amountInMaximum": p.uint256})}, p.uint256),
}

export class Contract extends ContractBase {

    WETH9() {
        return this.eth_call(functions.WETH9, {})
    }

    factory() {
        return this.eth_call(functions.factory, {})
    }
}

/// Function types
export type WETH9Params = FunctionArguments<typeof functions.WETH9>
export type WETH9Return = FunctionReturn<typeof functions.WETH9>

export type FactoryParams = FunctionArguments<typeof functions.factory>
export type FactoryReturn = FunctionReturn<typeof functions.factory>

export type MulticallParams = FunctionArguments<typeof functions.multicall>
export type MulticallReturn = FunctionReturn<typeof functions.multicall>

export type RefundETHParams = FunctionArguments<typeof functions.refundETH>
export type RefundETHReturn = FunctionReturn<typeof functions.refundETH>

export type SelfPermitParams = FunctionArguments<typeof functions.selfPermit>
export type SelfPermitReturn = FunctionReturn<typeof functions.selfPermit>

export type SelfPermitAllowedParams = FunctionArguments<typeof functions.selfPermitAllowed>
export type SelfPermitAllowedReturn = FunctionReturn<typeof functions.selfPermitAllowed>

export type SelfPermitAllowedIfNecessaryParams = FunctionArguments<typeof functions.selfPermitAllowedIfNecessary>
export type SelfPermitAllowedIfNecessaryReturn = FunctionReturn<typeof functions.selfPermitAllowedIfNecessary>

export type SelfPermitIfNecessaryParams = FunctionArguments<typeof functions.selfPermitIfNecessary>
export type SelfPermitIfNecessaryReturn = FunctionReturn<typeof functions.selfPermitIfNecessary>

export type SweepTokenParams = FunctionArguments<typeof functions.sweepToken>
export type SweepTokenReturn = FunctionReturn<typeof functions.sweepToken>

export type SweepTokenWithFeeParams = FunctionArguments<typeof functions.sweepTokenWithFee>
export type SweepTokenWithFeeReturn = FunctionReturn<typeof functions.sweepTokenWithFee>

export type UnwrapWETH9Params = FunctionArguments<typeof functions.unwrapWETH9>
export type UnwrapWETH9Return = FunctionReturn<typeof functions.unwrapWETH9>

export type UnwrapWETH9WithFeeParams = FunctionArguments<typeof functions.unwrapWETH9WithFee>
export type UnwrapWETH9WithFeeReturn = FunctionReturn<typeof functions.unwrapWETH9WithFee>

export type UniswapV3SwapCallbackParams = FunctionArguments<typeof functions.uniswapV3SwapCallback>
export type UniswapV3SwapCallbackReturn = FunctionReturn<typeof functions.uniswapV3SwapCallback>

export type ExactInputSingleParams = FunctionArguments<typeof functions.exactInputSingle>
export type ExactInputSingleReturn = FunctionReturn<typeof functions.exactInputSingle>

export type ExactInputParams = FunctionArguments<typeof functions.exactInput>
export type ExactInputReturn = FunctionReturn<typeof functions.exactInput>

export type ExactOutputSingleParams = FunctionArguments<typeof functions.exactOutputSingle>
export type ExactOutputSingleReturn = FunctionReturn<typeof functions.exactOutputSingle>

export type ExactOutputParams = FunctionArguments<typeof functions.exactOutput>
export type ExactOutputReturn = FunctionReturn<typeof functions.exactOutput>

