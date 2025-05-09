import { EventRecord } from '@subsquid/evm-abi';
import { TronBatchProcessor } from '@subsquid/tron-processor';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { functions as SmartExchangeRouterFunction } from './abi/generated/SmartExchangeRouter';
import { functions as V2RouterFunction } from './abi/generated/V2Router';
import { events as FactoryEvent, functions as FactoryFunction } from './abi/generated/V3Factory';
import { functions as PositionManagerFunction } from './abi/generated/V3NFTPositionManager';
import { functions as PoolFunction } from './abi/generated/V3Pool';
import { functions as V3RouterFunction } from './abi/generated/V3SwapRouter';
import { SmartExchangeRouterAddress, SmartExchangeRouter as SmartRouter } from './contracts/SmartExchangeRouter';
import { FactoryAddress } from './contracts/V3Factory';
import { PositionManagerAddress, V3PositionManager } from './contracts/V3PositionManager';
import { RouterAddress, V3Router } from './contracts/V3Router';
import { FeeAmountStore } from './store/FeeAmountStore';
import { PoolStore } from './store/PoolStore';
import { PositionStore } from './store/PositionStore';


const USDT_ADDRESS = '0xa614f803b6fd780986a42c78ec9c7f77e6ded13c'.toLowerCase(); //TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
// const SUN_ADDRESS = '0xb4A428ab7092c2f1395f376cE297033B3bB446C1'.toLowerCase(); //TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S
const WTRX_ADDRESS = '0x891cdb91d149f23b1a45d9c5ca78a88d0cb44c18'.toLowerCase(); //TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR
// const QSI_ADDRESS = '0xa2e23968dcd2de9abac2aa52a647b7344ab13892'.toLowerCase(); //TQpTUUMU4JeBNjULXFBdose1Cew958NeUB




const PoolWTRXSUN = "c16bF2D44cEEF46f3B74a373Da51876625b05B2d".toLowerCase();
const V3FactoryAddress = FactoryAddress; // TThJt8zaJzJMhCEScH7zWKnp5buVZqys9x
const V3RouterAddress = RouterAddress; // TQAvWQpT9H916GckwWDJNhYZvQMkuRL7PN
const V2Router = 'e95812D8D5B5412D2b9F3A4D5a87CA15C5c51F33'.toLowerCase(); // TXF1xDbVGdxFGbovmmmXvBGu8ZiE3Lq4mR
const V3PositionManagerAddress = PositionManagerAddress; // TLSWrv7eC1AZCXkRjpqMZUmvgd99cj7pPF
// const SmartExchangeRouter = SmartExchangeRouterAddress; // TCFNp179Lg46D16zKoumd4Poa2WFFdtqYj

// const toHex = (address: string) => {
//     return toBeHex(decodeBase58(address)).substring(4);
// }

const processor = new TronBatchProcessor()
    // Provide Subsquid Network Gateway URL.
    .setGateway('https://v2.archive.subsquid.io/network/tron-mainnet')
    // Subsquid Network is always about N blocks behind the head.
    // We must use regular HTTP API endpoint to get through the last mile
    // and stay on top of the chain.
    // This is a limitation, and we promise to lift it in the future!
    .setHttpApi({
        // ankr public endpoint is heavily rate-limited so expect many 429 errors
        url: 'https://tron-rpc.publicnode.com',
        strideConcurrency: 1,
        strideSize: 1,
    })
    // .setBlockRange({ from: 69000000 })
    // .setBlockRange({ from: 57995081 })
    // .setBlockRange({ from: 57990000 })
    // .setBlockRange({ from: 52368185 })
    .setBlockRange({ from: 52419300 })

    // .includeAllBlocks()
    // .includeAllBlocks({ from: 64500000 })
    // .includeAllBlocks({ from: 69423942, to: 69423943 })
    // Block data returned by the data source has the following structure:
    //
    // interface Block {
    //     header: BlockHeader
    //     transactions: Transaction[]
    //     logs: Log[]
    //     internalTransactions: InternalTransaction[]
    // }
    //
    // For each block item we can specify a set of fields we want to fetch via `.setFields()` method.
    // Think about it as of SQL projection.
    //
    // Accurate selection of only required fields can have a notable positive impact
    // on performance when data is sourced from Subsquid Network.
    //
    // We do it below only for illustration as all fields we've selected
    // are fetched by default.
    //
    // It is possible to override default selection by setting undesired fields to `false`.
    .setFields({
        block: {
            timestamp: true,
        },
        balance: {},
        transaction: {
            ret: true,
            signature: true,
            parameter: true,
            permissionId: false,
            refBlockBytes: false,
            refBlockHash: true,
            feeLimit: false,
            expiration: false,
            timestamp: true,
            rawDataHex: true,
            fee: true,
            contractResult: true,
            contractAddress: true,
            resMessage: false,
            withdrawAmount: false,
            unfreezeAmount: false,
            withdrawExpireAmount: false,
            cancelUnfreezeV2Amount: false,
            result: true,
            energyFee: false,
            energyUsage: false,
            energyUsageTotal: false,
            netUsage: false,
            netFee: false,
            originEnergyUsage: false,
            energyPenaltyTotal: false,
            hash: true,
        },
        log: {
            address: true,
            data: true,
            topics: true,
        },
        internalTransaction: {
            hash: true,
            callValueInfo: true,
            note: true,
            rejected: true,
            extra: true,
        }
    })
    // By default, block can be skipped if it doesn't contain explicitly requested items.
    //
    // We request items via `.addXxx()` methods.
    //
    // Each `.addXxx()` method accepts item selection criteria
    // and also allows to request related items.
    // .addTriggerSmartContractTransaction({
    //     where: {
    //         contract: [
    //             SmartExchangeRouter,
    //         ],
    //         sighash: [
    //             SmartExchangeRouterFunction.swapExactInput.sighash.substring(2),
    //         ]
    //     }
    // })
    // .addTriggerSmartContractTransaction({
    //     where: {
    //         contract: [
    //             Factory,
    //         ],
    //         sighash: [
    //             FactoryFunction.createPool.sighash.substring(2),
    //             FactoryFunction.enableFeeAmount.sighash.substring(2),
    //             FactoryFunction.feeAmountTickSpacing.sighash.substring(2),
    //             FactoryFunction.parameters.sighash.substring(2),
    //         ]
    //     }
    // })
    .addTriggerSmartContractTransaction({
        where: {
            contract: [
                V3PositionManagerAddress,
            ],
            sighash: [
                PositionManagerFunction.createAndInitializePoolIfNecessary.sighash.substring(2),
                PositionManagerFunction.collect.sighash.substring(2),
                PositionManagerFunction.burn.sighash.substring(2),
                PositionManagerFunction.decreaseLiquidity.sighash.substring(2),
                PositionManagerFunction.increaseLiquidity.sighash.substring(2),
                PositionManagerFunction.mint.sighash.substring(2),
                PositionManagerFunction.multicall.sighash.substring(2),
            ]
        },
        include: { logs: true, }
    })
    .addTriggerSmartContractTransaction({
        where: {
            contract: [
                V3RouterAddress,
                V2Router,
                SmartExchangeRouterAddress,
            ],
            sighash: [
                V3RouterFunction.exactInput.sighash.substring(2),
                V3RouterFunction.exactInputSingle.sighash.substring(2),
                V3RouterFunction.exactOutputSingle.sighash.substring(2),
                V3RouterFunction.exactOutput.sighash.substring(2),
                V3RouterFunction.multicall.sighash.substring(2),

                SmartExchangeRouterFunction.swapExactInput.sighash.substring(2),
                V2RouterFunction.swapExactTokensForTokens.sighash.substring(2),
            ]
        }
    })

function checkMethod(data: string[]): any[] {
    const method: Record<string, string> = {
        [PositionManagerFunction.createAndInitializePoolIfNecessary.sighash.substring(2)]: "createAndInitializePoolIfNecessary",
        [PositionManagerFunction.collect.sighash.substring(2)]: "collect",
        [PositionManagerFunction.burn.sighash.substring(2)]: "burn",
        [PositionManagerFunction.decreaseLiquidity.sighash.substring(2)]: "decreaseLiquidity",
        [PositionManagerFunction.increaseLiquidity.sighash.substring(2)]: "increaseLiquidity",
        [PositionManagerFunction.mint.sighash.substring(2)]: "mint",
        [FactoryFunction.createPool.sighash.substring(2)]: "createPool",
        [FactoryFunction.enableFeeAmount.sighash.substring(2)]: "enableFeeAmount",
        [V3RouterFunction.exactInput.sighash.substring(2)]: "exactInput",
        [V3RouterFunction.exactInputSingle.sighash.substring(2)]: "exactInputSingle",
        [V3RouterFunction.exactOutputSingle.sighash.substring(2)]: "exactOutputSingle",
        [V3RouterFunction.exactOutput.sighash.substring(2)]: "exactOutput",

        [PoolFunction.burn.sighash.substring(2)]: "pool.burn",
        [PoolFunction.collect.sighash.substring(2)]: "pool.collect",
        [PoolFunction.collectProtocol.sighash.substring(2)]: "pool.collectProtocol",
        [PoolFunction.factory.sighash.substring(2)]: "pool.factory",
        [PoolFunction.fee.sighash.substring(2)]: "pool.fee",
        [PoolFunction.swap.sighash.substring(2)]: "pool.swap",
        [PoolFunction.flash.sighash.substring(2)]: "pool.flash",

    }

    const poolm = [
        "pool.burn",
        "pool.collect",
        "pool.collectProtocol",
        "pool.factory",
        "pool.fee",
        "pool.swap",
        "pool.flash",]

    const decodes = [];

    for (let i of data) {

        if (method[i.substring(2, 10)]) {
            const m = method[i.substring(2, 10)];
            decodes.push(m);
            if (poolm.includes(m)) console.log("found pool operations on multicall====", m)
        } else {
            // decodes.push([i.substring(2, 10), i])
            decodes.push(i.substring(2, 10));
        }
    }
    // console.log(decodes);

    return decodes;
}

let hasinit = false;

processor.run(new TypeormDatabase(), async (ctx) => {

    try {
        if (!hasinit) {
            const feeAmountStore = new FeeAmountStore(ctx.store);
            await feeAmountStore.ensureDefault();
            hasinit = true;
        }
    } catch (__) { }

    const pairsAB = USDT_ADDRESS + WTRX_ADDRESS;
    const pairsBA = WTRX_ADDRESS + USDT_ADDRESS;

    for (let block of ctx.blocks) {
        for (let trx of block.transactions) {

            if (trx.result === 'SUCCESS') {

                const sighash = (trx.parameter.value.data as string).substring(0, 8);
                const paramData = '0x' + trx.parameter.value.data;
                const caller = '0x' + trx.parameter.value.owner_address.toLowerCase();
                const router = new V3Router(ctx.store, USDT_ADDRESS, WTRX_ADDRESS, caller, block.header.timestamp, block.header.height);
                const positionManager = new V3PositionManager(ctx.store, caller, trx.block.timestamp, trx.block.height);
                const smartExchangeRouter = new SmartRouter(ctx.store, caller, trx.block.timestamp, trx.block.height);
                const poolStore = new PoolStore(ctx.store);
                const positionStore = new PositionStore(ctx.store);

                if (trx.parameter.value.contract_address === SmartExchangeRouterAddress) {

                    const decoded = SmartExchangeRouterFunction.swapExactInput.decode(paramData);
                    console.dir(["SmartExchangeRouter.swapExactInput", decoded], { depth: null });
                    await smartExchangeRouter.swapExactInput(decoded.path, decoded.poolVersion, decoded.versionLen, decoded.fees, decoded.data);
                    // console.dir(, { depth: null });
                }

                if (trx.parameter.value.contract_address === V2Router) {
                    const decoded = V2RouterFunction.swapExactTokensForTokens.decode(paramData);
                    console.dir(["V2Router.swapExactTokensForTokens", decoded], { depth: null });
                    // console.dir(, { depth: null });
                }

                if (trx.parameter.value.contract_address === V3PositionManagerAddress) {
                    try {
                        switch (sighash) {
                            case PositionManagerFunction.createAndInitializePoolIfNecessary.sighash.substring(2):
                                {
                                    const params = PositionManagerFunction.createAndInitializePoolIfNecessary.decode(paramData);
                                    const tokens = params.token0 + params.token1;
                                    if (tokens !== pairsAB && tokens !== pairsBA) break;
                                    // console.log(PositionManagerFunction.createAndInitializePoolIfNecessary.decodeResult(trx.contractResult!));
                                    const poolId = await positionManager.createAndInitializePoolIfNecessary(params.token0, params.token1, params.fee, params.sqrtPriceX96);
                                    console.log(`created pool ${poolId} at ${trx.hash}`);
                                    const firstLog = trx.logs!.at(0);
                                    firstLog!.topics = firstLog!.topics!.map(a => ('0x' + a));
                                    firstLog!.data = '0x' + firstLog?.data
                                    if (FactoryEvent.PoolCreated.is(firstLog as EventRecord)) {
                                        const pool = await poolStore.getById(poolId);
                                        const data = FactoryEvent.PoolCreated.decode(firstLog as EventRecord)
                                        if (pool) {
                                            pool.address = data.pool;
                                            await poolStore.save(pool);
                                        }
                                    }
                                    break;
                                }

                            case PositionManagerFunction.collect.sighash.substring(2):
                                {
                                    const params = PositionManagerFunction.collect.decode(paramData);
                                    await positionManager.collect(params.params);
                                    break;
                                }

                            case PositionManagerFunction.burn.sighash.substring(2):
                                {
                                    const params = PositionManagerFunction.burn.decode(paramData);
                                    await positionManager.burn(params.tokenId);
                                    break;
                                }

                            case PositionManagerFunction.decreaseLiquidity.sighash.substring(2):
                                {
                                    const params = PositionManagerFunction.decreaseLiquidity.decode(paramData);
                                    await positionManager.decreaseLiquidity(params.params);
                                    break;
                                }

                            case PositionManagerFunction.increaseLiquidity.sighash.substring(2):
                                {
                                    const params = PositionManagerFunction.increaseLiquidity.decode(paramData);
                                    // const result = PositionManagerFunction.increaseLiquidity.decodeResult(trx.contractResult!);
                                    await positionManager.increaseLiquidity(params.params);
                                    break;
                                }
                            case PositionManagerFunction.mint.sighash.substring(2):
                                {
                                    const params = PositionManagerFunction.mint.decode(paramData);
                                    const result = PositionManagerFunction.mint.decodeResult(trx.contractResult!);
                                    const tokens = params.params.token0 + params.params.token1;
                                    if (tokens !== pairsAB && tokens !== pairsBA) break;
                                    console.log(`mint ${trx.hash}`);
                                    // console.dir(["mint", caller, trx.hash, params], { depth: null });
                                    const { amount0, amount1, liquidity, id } = await positionManager.mint(params.params);
                                    // if (amount0 != result.amount0 || amount1 != result.amount1) console.dir(["mint: result mismatched", { hash: trx.hash, amount0, amount1, liquidity, result, params }], { depth: null });
                                    const position = await positionStore.getById(id);
                                    if (position) {
                                        position.tokenId = result.tokenId;
                                        await positionStore.save(position);
                                    }
                                    break;
                                }

                            case PositionManagerFunction.multicall.sighash.substring(2):
                                {
                                    const decoded = PositionManagerFunction.multicall.decode(paramData);

                                    const decodes = checkMethod(decoded.data);
                                    if (decodes.length < 1) break;
                                    for (let i = 0; i < decodes.length; i++) {
                                        const m = decodes[i];
                                        switch (m) {

                                            case "createAndInitializePoolIfNecessary":
                                                {
                                                    const params = PositionManagerFunction.createAndInitializePoolIfNecessary.decode(decoded.data[i]);
                                                    const tokens = params.token0 + params.token1;
                                                    if (tokens !== pairsAB && tokens !== pairsBA) break;
                                                    // console.dir({ param: "createAndInitializePoolIfNecessary", caller, hash: trx.hash, timestamp: trx.block.timestamp, heigth: trx.block.height, params }, { depth: null });
                                                    const poolId = await positionManager.createAndInitializePoolIfNecessary(params.token0, params.token1, params.fee, params.sqrtPriceX96);
                                                    console.log(`created pool ${poolId} at ${trx.hash}`);
                                                    const firstLog = trx.logs!.at(0);
                                                    firstLog!.topics = firstLog!.topics!.map(a => ('0x' + a));
                                                    firstLog!.data = '0x' + firstLog?.data
                                                    if (FactoryEvent.PoolCreated.is(firstLog as EventRecord)) {
                                                        const pool = await poolStore.getById(poolId);
                                                        const data = FactoryEvent.PoolCreated.decode(firstLog as EventRecord)
                                                        if (pool) {
                                                            pool.address = data.pool;
                                                            await poolStore.save(pool);
                                                        }
                                                    }
                                                    break;
                                                }
                                            case "mint": {
                                                const params = PositionManagerFunction.mint.decode(decoded.data[i]);
                                                const result = PositionManagerFunction.mint.decodeResult(trx.contractResult!);
                                                const tokens = params.params.token0 + params.params.token1;
                                                if (tokens !== pairsAB && tokens !== pairsBA) break;
                                                console.log(`mint ${trx.hash}`);
                                                // console.dir({ param: "mint", caller, hash: trx.hash, timestamp: trx.block.timestamp, heigth: trx.block.height, params }, { depth: null });
                                                const { amount0, amount1, liquidity, id } = await positionManager.mint(params.params);
                                                // if (amount0 != result.amount0 || amount1 != result.amount1) console.dir(["multicall mint: result mismatched", { hash: trx.hash, amount0, amount1, liquidity, result, params }], { depth: null });
                                                const position = await positionStore.getById(id);
                                                if (position) {
                                                    position.tokenId = result.tokenId;
                                                    await positionStore.save(position);
                                                }
                                                break;
                                            }

                                            case "collect":
                                                {
                                                    const params = PositionManagerFunction.collect.decode(decoded.data[i]);
                                                    const result = PositionManagerFunction.collect.decodeResult(trx.contractResult!);
                                                    // console.dir(["collect", result], { depth: null });
                                                    const { amount0, amount1, found } = await positionManager.collect(params.params);
                                                    if (found && (amount0 != result.amount0 || amount1 != result.amount1)) console.dir(["multicall collect: result mismatched", { hash: trx.hash, amount0, amount1, found, result, params }], { depth: null });
                                                    break;
                                                }
                                            case "burn":
                                                {
                                                    const params = PositionManagerFunction.burn.decode(decoded.data[i]);
                                                    // const result = PositionManagerFunction.burn.decodeResult(trx.contractResult!);
                                                    // console.dir(["burn", result], { depth: null });
                                                    await positionManager.burn(params.tokenId);
                                                    break;
                                                }

                                            case "decreaseLiquidity":
                                                {
                                                    const params = PositionManagerFunction.decreaseLiquidity.decode(decoded.data[i]);
                                                    const result = PositionManagerFunction.decreaseLiquidity.decodeResult(trx.contractResult!);
                                                    const { amount0, amount1, found } = await positionManager.decreaseLiquidity(params.params);
                                                    if (found && (amount0 != result.amount0 || amount1 != result.amount1)) console.dir(["multicall decreaseLiquidity: result mismatched", { hash: trx.hash, amount0, amount1, found, result, params }], { depth: null });
                                                    break;
                                                }
                                            case "increaseLiquidity":
                                                {
                                                    const params = PositionManagerFunction.increaseLiquidity.decode(decoded.data[i]);
                                                    // console.dir({ name: "increaseLiquidity", params });
                                                    await positionManager.increaseLiquidity(params.params);
                                                    break;
                                                }
                                            case "pool.flash":
                                                {
                                                    const params = PoolFunction.flash.decode(decoded.data[i]);
                                                    console.dir(["pool.flash", params], { depth: null });
                                                    // await positionManager.increaseLiquidity(params.params);
                                                    break;
                                                }

                                            // case "createPool":
                                            //     decodes.push([m, FactoryFunction.createPool.decode(i)]);
                                            //     break;
                                            // case "enableFeeAmount":
                                            //     decodes.push([m, FactoryFunction.enableFeeAmount.decode(i)]);
                                            //     break;

                                            case "exactInput":
                                                {

                                                    const params = V3RouterFunction.exactInput.decode(decoded.data[i]);
                                                    // const { tokenA, tokenB } = Path.decodeFirstPool(params.params.path);
                                                    // const tokens = tokenA + tokenB;
                                                    // if (tokens !== pairsAB && tokens !== pairsBA) break;
                                                    console.dir({ name: "exactInput", params });
                                                    await router.exactInput(params.params)
                                                    break;
                                                }
                                            case "exactInputSingle":
                                                {
                                                    const params = V3RouterFunction.exactInputSingle.decode(decoded.data[i]);
                                                    // const tokens = params.params.tokenIn + params.params.tokenOut;
                                                    // if (tokens !== pairsAB && tokens !== pairsBA) break;
                                                    console.dir({ name: "exactInputSingle", params });
                                                    await router.exactInputSingle(params.params)
                                                    break;
                                                }
                                            case "exactOutputSingle":
                                                {
                                                    const params = V3RouterFunction.exactOutputSingle.decode(decoded.data[i]);
                                                    // const tokens = params.params.tokenIn + params.params.tokenOut;
                                                    // if (tokens !== pairsAB && tokens !== pairsBA) break;
                                                    console.dir({ name: "exactOutputSingle", params });
                                                    await router.exactOutputSingle(params.params);
                                                    break;
                                                }
                                            case "exactOutput":
                                                {
                                                    const params = V3RouterFunction.exactOutput.decode(decoded.data[i]);
                                                    // const { tokenA, tokenB } = Path.decodeFirstPool(params.params.path);
                                                    // const tokens = tokenA + tokenB;
                                                    // if (tokens !== pairsAB && tokens !== pairsBA) break;
                                                    console.dir({ name: "exactOutput", params });
                                                    await router.exactOutput(params.params);
                                                    break;
                                                }
                                        }

                                    }
                                    break;
                                }
                        }
                    } catch (e: any) { console.error(e) }
                }

                if (trx.parameter.value.contract_address === V3RouterAddress) {
                    // const router = new Router(ctx.store, 60, 3000, block.header.timestamp, BigInt(block.header.height));
                    // const router = new Router(ctx.store, caller, WTRX_ADDRESS, QSI_ADDRESS, block.header.timestamp, block.header.height);
                    try {
                        switch (sighash) {

                            case V3RouterFunction.exactInput.sighash.substring(2):
                                {
                                    const decoded = V3RouterFunction.exactInput.decode(paramData);
                                    // const { tokenA, tokenB } = Path.decodeFirstPool(decoded.params.path);
                                    // const tokens = tokenA + tokenB;
                                    // if (tokens !== pairsAB && tokens !== pairsBA) break;
                                    console.dir({ name: "exactInput", decoded });
                                    await router.exactInput(decoded.params)
                                    break;
                                }

                            case V3RouterFunction.exactInputSingle.sighash.substring(2):
                                {
                                    const decoded = V3RouterFunction.exactInputSingle.decode(paramData);
                                    // const tokens = decoded.params.tokenIn + decoded.params.tokenOut;
                                    // if (tokens !== pairsAB && tokens !== pairsBA) break;
                                    console.dir({ name: "exactInputSingle", decoded });
                                    await router.exactInputSingle(decoded.params)
                                    break;
                                }

                            case V3RouterFunction.exactOutputSingle.sighash.substring(2):
                                {
                                    const decoded = V3RouterFunction.exactOutputSingle.decode(paramData);
                                    // const tokens = decoded.params.tokenIn + decoded.params.tokenOut;
                                    // if (tokens !== pairsAB && tokens !== pairsBA) break;
                                    console.dir({ name: "exactOutputSingle", decoded });
                                    await router.exactOutputSingle(decoded.params);
                                    break;
                                }

                            case V3RouterFunction.exactOutput.sighash.substring(2):
                                {
                                    const decoded = V3RouterFunction.exactOutput.decode(paramData);
                                    // const { tokenA, tokenB } = Path.decodeFirstPool(decoded.params.path);
                                    // const tokens = tokenA + tokenB;
                                    // if (tokens !== pairsAB && tokens !== pairsBA) break;
                                    console.dir({ name: "decodeFirstPool", decoded });
                                    await router.exactOutput(decoded.params);
                                    break;
                                }

                            case V3RouterFunction.multicall.sighash.substring(2):
                                {
                                    const decoded = V3RouterFunction.multicall.decode(paramData);
                                    console.dir(["SwapRouterFunction.multicall", decoded], { depth: null });
                                    break;
                                }

                        }
                    } catch (e: any) { console.error(e) }
                }
            }
        }

        // for (let itrx of block.internalTransactions) {
        //     console.dir(itrx, { depth: null });
        // }
    }
})