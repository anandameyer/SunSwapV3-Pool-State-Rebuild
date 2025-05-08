import { Store } from '@subsquid/typeorm-store';
import { ethers } from 'ethers';
import { V3Encode } from '../libraries/V3Encode';
import { V3Router } from './V3Router';

export const SmartExchangeRouterAddress = '18fF186cb1973D4b29700f2aAC6B1eEC9e55FfbD'.toLowerCase();

interface TransactionResult {
    isSuccess: boolean;
    data: string;
}

interface Context {
    version: string;
    len: bigint;
    path_i: bigint;
    offset: bigint;
    amountIn: bigint;
    amountOutMin: bigint;
    deadline: bigint;
    pathSlice: string[];
    amountsOutSlice: bigint[];
    recipient: string;
    feesSlice: number[];
}

interface SwapData {
    amountIn: bigint;
    amountOutMin: bigint;
    to: string;
    deadline: bigint;
}

export class SmartExchangeRouter {
    // private owner: string;
    // private admin: string;
    // private v1Factory: string;
    // private v2Router: string;
    // private v3Router: string;
    // private psmUsdd: string;
    // private WTRX: string;

    // private tokenApprovedPool: Map<string, Map<string, boolean>> = new Map();
    // private existPools: Map<string, boolean> = new Map();
    // private poolToken: Map<string, Map<string, BigInt>> = new Map();
    // private stablePools: Map<string, string> = new Map();
    // private poolVersionUsdc: Map<string, boolean> = new Map();
    // private poolVersionPsm: Map<string, boolean> = new Map();
    // private psmRelativeDecimals: Map<string, BigInt> = new Map();

    private readonly maxNum: BigInt = ethers.MaxUint256;
    private readonly poolVersionV1: string = ethers.keccak256(ethers.toUtf8Bytes("v1"));
    private readonly poolVersionV2: string = ethers.keccak256(ethers.toUtf8Bytes("v2"));
    private readonly poolVersionV3: string = ethers.keccak256(ethers.toUtf8Bytes("v3"));
    private readonly store: Store;
    private readonly sender: string;
    private readonly blockTimestamp: number;
    private readonly blockNumber: number;
    private readonly address: string = '0x' + SmartExchangeRouterAddress;

    constructor(
        store: Store,
        sender: string,
        blockTimestamp: number,
        blockNumber: number,
        // _v2Router: string,
        // _v1Factory: string,
        // _psmUsdd: string,
        // _v3Router: string,
        // _wtrx: string
    ) {
        this.store = store;
        this.sender = sender;
        this.blockTimestamp = blockTimestamp;
        this.blockNumber = blockNumber;
        // super();
        // this.owner = ethers.ZeroAddress; // Will be set by the deployer
        // this.admin = ethers.ZeroAddress; // Will be set by the deployer
        // this.v1Factory = _v1Factory;
        // this.v2Router = _v2Router;
        // this.v3Router = _v3Router;
        // this.psmUsdd = _psmUsdd;
        // this.WTRX = _wtrx;
    }

    // Events
    public readonly SwapExactETHForTokens = "SwapExactETHForTokens";
    public readonly SwapExactTokensForTokens = "SwapExactTokensForTokens";
    public readonly TransferOwnership = "TransferOwnership";
    public readonly TransferAdminship = "TransferAdminship";
    public readonly AddPool = "AddPool";
    public readonly ChangePool = "ChangePool";

    // // Modifiers
    // private onlyOwner(): void {
    //     if (ethers.utils.getAddress(this.owner) !== ethers.utils.getAddress(this.owner)) {
    //         throw new Error("Permission denied, not an owner");
    //     }
    // }

    // private onlyAdmin(): void {
    //     if (ethers.utils.getAddress(this.admin) !== ethers.utils.getAddress(this.admin)) {
    //         throw new Error("Permission denied, not an admin");
    //     }
    // }

    // // External functions
    // public transferOwnership(newOwner: string): void {
    //     this.onlyOwner();
    //     this.owner = newOwner;
    //     // Emit TransferOwnership event
    // }

    // public transferAdminship(newAdmin: string): void {
    //     this.onlyAdmin();
    //     this.admin = newAdmin;
    //     // Emit TransferAdminship event
    // }

    // public async retrieve(token: string, to: string, amount: BigNumber): Promise<void> {
    //     this.onlyOwner();
    //     if (token === ethers.constants.AddressZero) {
    //         await TransferHelper.safeTransferETH(to, amount);
    //     } else {
    //         const success = await TransferHelper.safeTransfer(token, to, amount);
    //         if (!success) {
    //             throw new Error("Transfer failed");
    //         }
    //     }
    // }

    // public addPool(poolVersion: string, pool: string, tokens: string[]): void {
    //     this.onlyOwner();
    //     if (this.existPools.get(pool)) {
    //         throw new Error("pool exist");
    //     }
    //     if (tokens.length <= 1) {
    //         throw new Error("at least 2 tokens");
    //     }

    //     const tokenMap = new Map<string, BigNumber>();
    //     for (let i = 0; i < tokens.length; i++) {
    //         tokenMap.set(tokens[i], BigNumber.from(i));
    //         this._approveToken(tokens[i], pool);
    //     }
    //     this.poolToken.set(pool, tokenMap);
    //     this.stablePools.set(poolVersion, pool);
    //     this.existPools.set(pool, true);
    //     // Emit AddPool event
    // }

    // public addUsdcPool(poolVersion: string, pool: string, tokens: string[]): void {
    //     this.addPool(poolVersion, pool, tokens);
    //     this.poolVersionUsdc.set(poolVersion, true);
    // }

    // public addPsmPool(poolVersion: string, pool: string, gemJoin: string, tokens: string[]): void {
    //     this.onlyOwner();
    //     if (this.existPools.get(pool)) {
    //         throw new Error("pool exist");
    //     }
    //     if (tokens.length !== 2 || !(tokens[0] === this.psmUsdd || tokens[1] === this.psmUsdd)) {
    //         throw new Error("invalid tokens");
    //     }

    //     let usddDecimals = BigNumber.from(1);
    //     let gemDecimals = BigNumber.from(1);
    //     const tokenMap = new Map<string, BigNumber>();

    //     for (let i = 0; i < tokens.length; i++) {
    //         tokenMap.set(tokens[i], BigNumber.from(i));
    //         if (tokens[i] === this.psmUsdd) {
    //             this._approveToken(tokens[i], pool);
    //             // In real implementation, we would fetch decimals from the token contract
    //             usddDecimals = BigNumber.from(18); // Assuming 18 decimals for USDD
    //         } else {
    //             this._approveToken(tokens[i], gemJoin);
    //             // In real implementation, we would fetch decimals from the token contract
    //             gemDecimals = BigNumber.from(6); // Assuming 6 decimals for the gem
    //         }
    //     }

    //     this.psmRelativeDecimals.set(pool, BigNumber.from(10).pow(usddDecimals.sub(gemDecimals)));
    //     this.poolToken.set(pool, tokenMap);
    //     this.stablePools.set(poolVersion, pool);
    //     this.existPools.set(pool, true);
    //     this.poolVersionPsm.set(poolVersion, true);
    //     // Emit AddPool event
    // }

    // public isUsdcPool(poolVersion: string): boolean {
    //     return !!this.poolVersionUsdc.get(poolVersion);
    // }

    // public isPsmPool(poolVersion: string): boolean {
    //     return !!this.poolVersionPsm.get(poolVersion);
    // }

    // public changePool(pool: string, tokens: string[]): void {
    //     this.onlyAdmin();
    //     if (!this.existPools.get(pool)) {
    //         throw new Error("pool not exist");
    //     }
    //     if (tokens.length <= 1) {
    //         throw new Error("at least 2 tokens");
    //     }

    //     const tokenMap = new Map<string, BigNumber>();
    //     for (let i = 0; i < tokens.length; i++) {
    //         tokenMap.set(tokens[i], BigNumber.from(i));
    //         this._approveToken(tokens[i], pool);
    //     }
    //     this.poolToken.set(pool, tokenMap);
    //     // Emit ChangePool event
    // }

    public async swapExactInput(
        path: string[],
        poolVersion: string[],
        versionLen: bigint[],
        fees: number[],
        data: SwapData
    ): Promise<bigint[]> {
        if (poolVersion.length !== versionLen.length || poolVersion.length === 0) {
            throw new Error("INVALID_POOL_VERSION.");
        }
        if (path.length === 0) {
            throw new Error("INVALID_PATH");
        }
        if (path.length !== fees.length) {
            throw new Error("INVALID_PATH");
        }

        const amountsOut: bigint[] = new Array(path.length).fill(0n);

        if (path[0] === ethers.ZeroAddress) {
            // In a real implementation, we would check the msg.value
            amountsOut[0] = data.amountIn;
        } else {
            // amountsOut[0] = await this._tokenSafeTransferFrom(
            //     path[0],
            //     this.owner, // In real implementation, this would be msg.sender
            //     this.owner, // In real implementation, this would be the contract address
            //     data.amountIn
            // );
        }

        const context: Context = {
            version: "",
            len: 0n,
            path_i: 0n,
            offset: 0n,
            amountIn: 0n,
            amountOutMin: 0n,
            deadline: data.deadline,
            pathSlice: [],
            amountsOutSlice: [],
            recipient: "",
            feesSlice: []
        };

        for (let i = 0; i < poolVersion.length; i++) {
            context.version = ethers.keccak256(ethers.toUtf8Bytes(poolVersion[i]));
            context.len = i === 0 ? versionLen[i] - 1n : versionLen[i];

            if (context.len <= 0 || context.path_i + context.len > path.length) {
                throw new Error("INVALID_VERSION_LEN");
            }

            context.amountIn = amountsOut[parseInt(BigInt.asIntN(64, (context.path_i - 1n)).toString())];
            context.amountOutMin = i + 1 === poolVersion.length ? data.amountOutMin : 1n;
            context.recipient = i + 1 === poolVersion.length ? data.to : this.address; // In real implementation, this would be the contract address

            if (context.version === this.poolVersionV2) {
                // context.pathSlice = this._constructPathSlice(path, this._toNumber(context.path_i - 1n,), this._toNumber(context.len + 1n));
                // context.amountsOutSlice = await this._swapExactTokensForTokensV2(context);

                // for (let j = 0; j < context.len.toNumber(); j++) {
                //     amountsOut[context.path_i.toNumber()] = context.amountsOutSlice[j + 1];
                //     context.path_i = context.path_i.add(1);
                // }
            } else if (context.version === this.poolVersionV1) {
                // context.pathSlice = this._constructPathSlice(path, context.path_i.sub(1).toNumber(), context.len.add(1).toNumber());
                // context.amountsOutSlice = await this._swapExactTokensForTokensV1(context);

                // for (let j = 0; j < context.len.toNumber(); j++) {
                //     amountsOut[context.path_i.toNumber()] = context.amountsOutSlice[j + 1];
                //     context.path_i = context.path_i.add(1);
                // }
            } else if (context.version === this.poolVersionV3) {
                context.pathSlice = this._constructPathSlice(path, this._toNumber(context.path_i - 1n), this._toNumber(context.len + 1n));
                context.feesSlice = this._constructFeesSlice(fees, this._toNumber(context.path_i - 1n), this._toNumber(context.len + 1n));
                context.amountsOutSlice = await this._swapExactInputV3(context);

                for (let j = 0; j < this._toNumber(context.len); j++) {
                    amountsOut[this._toNumber(context.path_i)] = context.amountsOutSlice[j + 1];
                    context.path_i = context.path_i + 1n;
                }
            } else {
                // context.pathSlice = this._constructPathSlice(path, context.path_i.sub(1).toNumber(), context.len.add(1).toNumber());
                // context.amountsOutSlice = await this._stablePoolExchange(
                //     poolVersion[i],
                //     context.pathSlice,
                //     context.amountIn,
                //     context.amountOutMin
                // );

                // for (let j = 0; j < context.len.toNumber(); j++) {
                //     amountsOut[context.path_i.toNumber()] = context.amountsOutSlice[j + 1];
                //     context.path_i = context.path_i.add(1);
                // }

                // if (context.path_i.eq(path.length)) {
                //     amountsOut[context.path_i.toNumber() - 1] = await this._tokenSafeTransfer(
                //         path[context.path_i.toNumber() - 1],
                //         context.recipient,
                //         amountsOut[context.path_i.toNumber() - 1]
                //     );

                //     if (amountsOut[context.path_i.toNumber() - 1].lt(context.amountOutMin)) {
                //         throw new Error("amountOutMin not satisfied.");
                //     }
                // }
            }
        }

        if (amountsOut[path.length - 1] < data.amountOutMin) {
            throw new Error("Global amountOutMin not satisfied.");
        }

        if (context.path_i != BigInt(path.length)) {
            throw new Error("Path length mismatch");
        }

        // Emit SwapExactTokensForTokens event
        return amountsOut;
    }

    // // Internal functions
    // private _approveToken(token: string, pool: string): void {
    //     if (!this.tokenApprovedPool.get(token)?.get(pool)) {
    //         const success = TransferHelper.safeApprove(token, pool, this.maxNum);
    //         if (!success) {
    //             throw new Error("Approve failed");
    //         }

    //         if (!this.tokenApprovedPool.has(token)) {
    //             this.tokenApprovedPool.set(token, new Map());
    //         }
    //         this.tokenApprovedPool.get(token)?.set(pool, true);
    //     }
    // }

    private _constructPathSlice(path: string[], pos: number, len: number): string[] {
        if (len <= 1 || pos + len > path.length) {
            throw new Error("INVALID_ARGS");
        }
        return path.slice(pos, pos + len);
    }

    private _toNumber(number: bigint): number {
        return parseInt(BigInt.asIntN(64, number).toString())
    }

    private _constructFeesSlice(fees: number[], pos: number, len: number): number[] {
        if (len <= 1 || pos + len > fees.length) {
            throw new Error("INVALID_FEES");
        }
        return fees.slice(pos, pos + len);
    }

    // private async _tokenSafeTransferFrom(token: string, from: string, to: string, value: BigNumber): Promise<BigNumber> {
    //     if (from === to) {
    //         throw new Error("INVALID_ARGS");
    //     }

    //     const tokenContract = new ethers.Contract(token, IERC20.abi);
    //     const balanceBefore = await tokenContract.balanceOf(to);

    //     const success = await TransferHelper.safeTransferFrom(token, from, to, value);
    //     if (!success) {
    //         throw new Error("Transfer failed");
    //     }

    //     const balanceAfter = await tokenContract.balanceOf(to);
    //     return balanceAfter.sub(balanceBefore);
    // }

    // private async _tokenSafeTransfer(token: string, to: string, value: BigNumber): Promise<BigNumber> {
    //     if (to === this.owner || to === ethers.constants.AddressZero) {
    //         throw new Error("INVALID_ARGS");
    //     }

    //     const tokenContract = new ethers.Contract(token, IERC20.abi);
    //     const balanceBefore = await tokenContract.balanceOf(to);

    //     const success = await TransferHelper.safeTransfer(token, to, value);
    //     if (!success) {
    //         throw new Error("Transfer failed");
    //     }

    //     const balanceAfter = await tokenContract.balanceOf(to);
    //     return balanceAfter.sub(balanceBefore);
    // }

    // // StablePool functions
    // private async _stablePoolExchange(
    //     poolVersion: string,
    //     path: string[],
    //     amountIn: BigNumber,
    //     amountOutMin: BigNumber
    // ): Promise<BigNumber[]> {
    //     const pool = this.stablePools.get(poolVersion);
    //     if (!pool) {
    //         throw new Error("pool not exist");
    //     }
    //     if (path.length <= 1) {
    //         throw new Error("INVALID_PATH_SLICE");
    //     }

    //     const amountsOut: BigNumber[] = new Array(path.length).fill(BigNumber.from(0));
    //     amountsOut[0] = amountIn;

    //     for (let i = 1; i < path.length; i++) {
    //         const tokenIdIn = this.poolToken.get(pool)?.get(path[i - 1]);
    //         const tokenIdOut = this.poolToken.get(pool)?.get(path[i]);

    //         if (!tokenIdIn || !tokenIdOut || tokenIdIn.eq(tokenIdOut)) {
    //             throw new Error("INVALID_PATH_SLICE");
    //         }

    //         const amountMin = i + 1 === path.length ? amountOutMin : BigNumber.from(1);
    //         const tokenContract = new ethers.Contract(path[i], IERC20.abi);
    //         const balanceBefore = await tokenContract.balanceOf(this.owner); // In real implementation, this would be the contract address

    //         if (this.isUsdcPool(poolVersion)) {
    //             const poolContract = new ethers.Contract(pool, IPoolStable.abi);
    //             await poolContract.exchange_underlying(
    //                 tokenIdIn,
    //                 tokenIdOut,
    //                 amountsOut[i - 1],
    //                 amountMin
    //             );
    //         } else if (this.isPsmPool(poolVersion)) {
    //             const psmContract = new ethers.Contract(pool, IPoolPsm.abi);
    //             if (path[i - 1] === this.psmUsdd) {
    //                 await psmContract.buyGem(
    //                     this.owner, // In real implementation, this would be the contract address
    //                     amountsOut[i - 1].div(this.psmRelativeDecimals.get(pool) || BigNumber.from(1))
    //                 );
    //             } else if (path[i] === this.psmUsdd) {
    //                 await psmContract.sellGem(
    //                     this.owner, // In real implementation, this would be the contract address
    //                     amountsOut[i - 1]
    //                 );
    //             } else {
    //                 throw new Error('INVALID_PSM_TOKEN');
    //             }
    //         } else {
    //             const poolContract = new ethers.Contract(pool, IPoolStable.abi);
    //             await poolContract.exchange(
    //                 tokenIdIn,
    //                 tokenIdOut,
    //                 amountsOut[i - 1],
    //                 amountMin
    //             );
    //         }

    //         const balanceAfter = await tokenContract.balanceOf(this.owner); // In real implementation, this would be the contract address
    //         amountsOut[i] = balanceAfter.sub(balanceBefore);

    //         if (amountsOut[i].lt(amountMin)) {
    //             throw new Error("amountMin not satisfied");
    //         }
    //     }

    //     return amountsOut;
    // }

    // // V1 functions
    // private async _trxToTokenTransferInput(
    //     token: string,
    //     amountIn: BigNumber,
    //     amountOutMin: BigNumber,
    //     recipient: string,
    //     deadline: BigNumber
    // ): Promise<BigNumber> {
    //     const v1Contract = new ethers.Contract(this.v1Factory, IRouterV1.abi);
    //     const exchange = await v1Contract.getExchange(token);
    //     if (exchange === ethers.constants.AddressZero) {
    //         throw new Error("exchanger not found");
    //     }

    //     const result = await TransferHelper.executeTransaction(
    //         exchange,
    //         amountIn,
    //         "trxToTokenTransferInput(uint256,uint256,address)",
    //         [amountOutMin, deadline, recipient]
    //     );

    //     if (!result.isSuccess) {
    //         throw new Error("Transaction failed.");
    //     }

    //     return ethers.BigNumber.from(result.data);
    // }

    // private async _tokenToTrxTransferInput(
    //     token: string,
    //     amountIn: BigNumber,
    //     amountOutMin: BigNumber,
    //     recipient: string,
    //     deadline: BigNumber
    // ): Promise<BigNumber> {
    //     const v1Contract = new ethers.Contract(this.v1Factory, IRouterV1.abi);
    //     const exchange = await v1Contract.getExchange(token);
    //     if (exchange === ethers.constants.AddressZero) {
    //         throw new Error("exchanger not found");
    //     }

    //     this._approveToken(token, exchange);

    //     const result = await TransferHelper.executeTransaction(
    //         exchange,
    //         BigNumber.from(0),
    //         "tokenToTrxTransferInput(uint256,uint256,uint256,address)",
    //         [amountIn, amountOutMin, deadline, recipient]
    //     );

    //     if (!result.isSuccess) {
    //         throw new Error("Transaction failed.");
    //     }

    //     return ethers.BigNumber.from(result.data);
    // }

    // private async _tokenToTokenTransferInput(
    //     tokenIn: string,
    //     tokenOut: string,
    //     context: Context
    // ): Promise<BigNumber> {
    //     const v1Contract = new ethers.Contract(this.v1Factory, IRouterV1.abi);
    //     const exchange = await v1Contract.getExchange(tokenIn);
    //     if (exchange === ethers.constants.AddressZero) {
    //         throw new Error("exchanger not found");
    //     }

    //     this._approveToken(tokenIn, exchange);

    //     const result = await TransferHelper.executeTransaction(
    //         exchange,
    //         BigNumber.from(0),
    //         "tokenToTokenTransferInput(uint256,uint256,uint256,uint256,address,address)",
    //         [
    //             context.amountIn,
    //             context.amountOutMin,
    //             BigNumber.from(1),
    //             context.deadline,
    //             context.recipient,
    //             tokenOut
    //         ]
    //     );

    //     if (!result.isSuccess) {
    //         throw new Error("Transaction failed.");
    //     }

    //     return ethers.BigNumber.from(result.data);
    // }

    // private async _swapExactTokensForTokensV1(context: Context): Promise<BigNumber[]> {
    //     if (context.pathSlice.length <= 1) {
    //         throw new Error("INVALID_PATH_SLICE");
    //     }

    //     const amountsOut: BigNumber[] = new Array(context.pathSlice.length).fill(BigNumber.from(0));
    //     amountsOut[0] = context.amountIn;

    //     for (let i = 1; i < context.pathSlice.length; i++) {
    //         if (context.pathSlice[i - 1] === context.pathSlice[i]) {
    //             throw new Error("INVALID_PATH_SLICE");
    //         }

    //         const ctx: Context = {
    //             ...context,
    //             amountIn: amountsOut[i - 1],
    //             amountOutMin: i + 1 === context.pathSlice.length ? context.amountOutMin : BigNumber.from(1),
    //             recipient: i + 1 === context.pathSlice.length ? context.recipient : this.owner, // In real implementation, this would be the contract address
    //         };

    //         if (context.pathSlice[i - 1] === ethers.constants.AddressZero) {
    //             amountsOut[i] = await this._trxToTokenTransferInput(
    //                 context.pathSlice[i],
    //                 ctx.amountIn,
    //                 ctx.amountOutMin,
    //                 ctx.recipient,
    //                 ctx.deadline
    //             );
    //         } else if (context.pathSlice[i] === ethers.constants.AddressZero) {
    //             amountsOut[i] = await this._tokenToTrxTransferInput(
    //                 context.pathSlice[i - 1],
    //                 ctx.amountIn,
    //                 ctx.amountOutMin,
    //                 ctx.recipient,
    //                 ctx.deadline
    //             );
    //         } else {
    //             amountsOut[i] = await this._tokenToTokenTransferInput(
    //                 context.pathSlice[i - 1],
    //                 context.pathSlice[i],
    //                 ctx
    //             );
    //         }
    //     }

    //     return amountsOut;
    // }

    // // V2 functions
    // private async _swapExactTokensForTokensV2(context: Context): Promise<BigNumber[]> {
    //     if (context.pathSlice.length <= 1) {
    //         throw new Error("INVALID_PATH_SLICE");
    //     }

    //     const tokenIn = context.pathSlice[0];
    //     const tokenOut = context.pathSlice[context.pathSlice.length - 1];
    //     const amounts: BigNumber[] = new Array(context.pathSlice.length).fill(BigNumber.from(0));

    //     let midPath_start = 0;
    //     let midPath: string[] = [];

    //     if (tokenIn === ethers.constants.AddressZero) {
    //         amounts[0] = context.amountIn;
    //         amounts[1] = context.amountIn;

    //         const wtrxContract = new ethers.Contract(this.WTRX, IWTRX.abi);
    //         await wtrxContract.deposit({ value: context.amountIn });

    //         if (context.pathSlice.length === 2) {
    //             await TransferHelper.safeTransfer(this.WTRX, context.recipient, context.amountIn);
    //             return amounts;
    //         }

    //         midPath = this._constructPathSlice(context.pathSlice, 1, context.pathSlice.length - 1);
    //         midPath_start = 1;
    //     } else {
    //         midPath = context.pathSlice;
    //     }

    //     let outAmounts: BigNumber[] = [];

    //     if (tokenOut === ethers.constants.AddressZero) {
    //         if (context.pathSlice.length === 2) {
    //             amounts[0] = context.amountIn;
    //             amounts[1] = context.amountIn;
    //             await this.unwrapWTRX(context.amountIn, context.recipient);
    //             return amounts;
    //         }

    //         this._approveToken(midPath[0], this.v2Router);
    //         const v2Contract = new ethers.Contract(this.v2Router, IRouterV2.abi);
    //         outAmounts = await v2Contract.swapExactTokensForTokens(
    //             context.amountIn,
    //             context.amountOutMin,
    //             this._constructPathSlice(midPath, 0, midPath.length - 1),
    //             this.owner, // In real implementation, this would be the contract address
    //             context.deadline
    //         );

    //         for (let i = 0; i < outAmounts.length; i++) {
    //             amounts[midPath_start + i] = outAmounts[i];
    //         }

    //         amounts[amounts.length - 1] = amounts[amounts.length - 2];
    //         await this.unwrapWTRX(amounts[amounts.length - 1], context.recipient);
    //     } else {
    //         this._approveToken(midPath[0], this.v2Router);
    //         const v2Contract = new ethers.Contract(this.v2Router, IRouterV2.abi);
    //         outAmounts = await v2Contract.swapExactTokensForTokens(
    //             context.amountIn,
    //             context.amountOutMin,
    //             this._constructPathSlice(midPath, 0, midPath.length),
    //             context.recipient,
    //             context.deadline
    //         );

    //         for (let i = 0; i < outAmounts.length; i++) {
    //             amounts[midPath_start + i] = outAmounts[i];
    //         }
    //     }

    //     return amounts;
    // }

    // V3 functions
    private async _swapExactInputV3(context: Context): Promise<bigint[]> {
        const amounts: bigint[] = new Array(context.pathSlice.length).fill(0n);

        if (context.pathSlice.length <= 1) {
            throw new Error("INVALID_PATH_SLICE");
        }

        const router = new V3Router(this.store, "", "", this.sender, this.blockTimestamp, this.blockNumber);

        // const v3Contract = new ethers.Contract(this.v3Router, IRouterV3.abi);
        const inputParams = {
            path: V3Encode.encodePath(context.pathSlice, context.feesSlice),
            recipient: context.recipient,
            deadline: context.deadline,
            amountIn: context.amountIn,
            amountOutMinimum: context.amountOutMin,
        };

        const amountOut = await router.exactInput(inputParams);

        // this._approveToken(context.pathSlice[0], this.v3Router);
        // const amountOut = await v3Contract.exactInput(inputParams);

        amounts[amounts.length - 1] = amountOut;
        return amounts;
    }

    // public async unwrapWTRX(amountMinimum: BigNumber, recipient: string): Promise<void> {
    //     const wtrxContract = new ethers.Contract(this.WTRX, IERC20.abi);
    //     const balanceWTRX = await wtrxContract.balanceOf(this.owner); // In real implementation, this would be the contract address

    //     if (balanceWTRX.lt(amountMinimum)) {
    //         throw new Error("Insufficient WTRX");
    //     }

    //     if (balanceWTRX.gt(0)) {
    //         const wtrxWrapper = new ethers.Contract(this.WTRX, IWTRX.abi);
    //         await wtrxWrapper.withdraw(balanceWTRX);

    //         if (recipient !== this.owner) { // In real implementation, this would be the contract address
    //             await TransferHelper.safeTransferETH(recipient, amountMinimum);
    //         }
    //     }
    // }
}