'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var remove = require('lodash.remove');
var ethers = require('ethers');
var units = require('@ethersproject/units');
var etherplex = require('@pooltogether/etherplex');
var currentPoolData = require('@pooltogether/current-pool-data');
var PrizePoolAbi = require('@pooltogether/pooltogether-contracts/abis/PrizePool');
var PrizeStrategyAbi = require('@pooltogether/pooltogether-contracts/abis/PeriodicPrizeStrategy');
var TokenFaucetABI = require('@pooltogether/pooltogether-contracts/abis/TokenFaucet');
var MultipleWinnersAbi = require('@pooltogether/pooltogether-contracts/abis/MultipleWinners');
var RegistryAbi = require('@pooltogether/pooltogether-contracts/abis/Registry');
var ReserveAbi = require('@pooltogether/pooltogether-contracts/abis/Reserve');
var CTokenAbi = require('@pooltogether/pooltogether-contracts/abis/CTokenInterface');
var LootBoxControllerAbi = require('@pooltogether/loot-box/abis/LootBoxController');
var SablierAbi = require('../../abis/SablierAbi.js');
var ERC20Abi = require('../../abis/ERC20Abi.js');
var CustomERC721 = require('../../abis/CustomERC721.js');
var cloudflareWorkersBatch = require('../cloudflare-workers-batch.js');
var constants = require('../constants.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var remove__default = /*#__PURE__*/_interopDefaultLegacy(remove);
var PrizePoolAbi__default = /*#__PURE__*/_interopDefaultLegacy(PrizePoolAbi);
var PrizeStrategyAbi__default = /*#__PURE__*/_interopDefaultLegacy(PrizeStrategyAbi);
var TokenFaucetABI__default = /*#__PURE__*/_interopDefaultLegacy(TokenFaucetABI);
var MultipleWinnersAbi__default = /*#__PURE__*/_interopDefaultLegacy(MultipleWinnersAbi);
var RegistryAbi__default = /*#__PURE__*/_interopDefaultLegacy(RegistryAbi);
var ReserveAbi__default = /*#__PURE__*/_interopDefaultLegacy(ReserveAbi);
var CTokenAbi__default = /*#__PURE__*/_interopDefaultLegacy(CTokenAbi);
var LootBoxControllerAbi__default = /*#__PURE__*/_interopDefaultLegacy(LootBoxControllerAbi);

const getExternalErc20AwardBatchName = (prizePoolAddress, tokenAddress) => "erc20Award-".concat(prizePoolAddress, "-").concat(tokenAddress);

const getSablierErc20BatchName = (prizePoolAddress, streamId) => "sablier-".concat(prizePoolAddress, "-").concat(streamId);

const getErc721BatchName = (prizeAddress, tokenId) => "erc721Award-".concat(prizeAddress, "-").concat(tokenId);

const getCTokenBatchName = (prizeAddress, tokenAddress) => "cToken-".concat(prizeAddress, "-").concat(tokenAddress);

const getLootBoxBatchName = (lootBoxAddress, lootBoxId) => "lootBox-".concat(lootBoxAddress, "-").concat(lootBoxId);

const getRegistryBatchName = (registryAddress, prizePoolAddress) => "registry-".concat(registryAddress, "-").concat(prizePoolAddress);

const getReserveBatchName = (reserveAddress, prizePoolAddress) => "reserve-".concat(reserveAddress, "-").concat(prizePoolAddress); // TODO: fetchExternalErc1155Awards


const getPool = graphPool => {
  const poolAddressKey = Object.keys(graphPool)[0];
  return graphPool[poolAddressKey];
};
/**
 *
 * @param {*} chainId
 * @param {*} poolContracts
 * @param {*} poolGraphData
 * @returns
 */


const getPoolChainData = async (chainId, poolGraphData, fetch) => {
  let pool;
  let batchCalls = [];
  const erc721AwardsToFetchMetadataFor = []; // First set of calls

  poolGraphData.forEach(graphPool => {
    var _contractAddresses$ch, _contractAddresses$ch2;

    pool = getPool(graphPool); // Prize Pool

    const prizePoolContract = etherplex.contract(pool.prizePool.address, PrizePoolAbi__default['default'], pool.prizePool.address);
    batchCalls.push(prizePoolContract.captureAwardBalance()); // Prize Strategy

    const prizeStrategyContract = etherplex.contract(pool.prizeStrategy.address, PrizeStrategyAbi__default['default'], pool.prizeStrategy.address);
    batchCalls.push(prizeStrategyContract.isRngRequested() // used to determine if the pool is locked
    .isRngCompleted().canStartAward().canCompleteAward().prizePeriodStartedAt().prizePeriodRemainingSeconds().prizePeriodSeconds().estimateRemainingBlocksToPrize(currentPoolData.SECONDS_PER_BLOCK[chainId] || currentPoolData.SECONDS_PER_BLOCK[1])); // TODO: Uniswap data
    // Token Listener
    // NOTE: If it's not a token faucet, this will break everything

    if (pool.tokenListener.address) {
      const tokenFaucetContract = etherplex.contract(pool.tokenListener.address, TokenFaucetABI__default['default'], pool.tokenListener.address);
      batchCalls.push(tokenFaucetContract.dripRatePerSecond().asset().measure());
    } // External ERC20 awards


    if (pool.prize.externalErc20Awards.length > 0) {
      pool.prize.externalErc20Awards.forEach(erc20 => {
        const erc20Contract = etherplex.contract(getExternalErc20AwardBatchName(pool.prizePool.address, erc20.address), ERC20Abi.ERC20Abi, erc20.address);
        batchCalls.push(erc20Contract.balanceOf(pool.prizePool.address));
      });
    } // External ERC721 awards


    if (pool.prize.externalErc721Awards.length > 0) {
      pool.prize.externalErc721Awards.forEach(erc721 => {
        erc721.tokenIds.forEach(tokenId => {
          const erc721Contract = etherplex.contract(getErc721BatchName(erc721.address, tokenId), CustomERC721.CustomERC721Abi, erc721.address);
          batchCalls.push(erc721Contract.balanceOf(pool.prizePool.address).name().symbol().ownerOf(tokenId));
          erc721AwardsToFetchMetadataFor.push({
            address: erc721.address,
            tokenId
          });
        });
      });
    } // Sablier


    if (pool.prize.sablierStream.id) {
      // TODO: Add sablier to contract addresses package
      const sablierContract = etherplex.contract(pool.prize.sablierStream.id, SablierAbi.SablierAbi, constants.CUSTOM_CONTRACT_ADDRESSES[chainId].Sablier);
      batchCalls.push(sablierContract.getStream(ethers.ethers.BigNumber.from(pool.prize.sablierStream.id)));
    } // cToken


    if (pool.tokens.cToken) {
      const cTokenContract = etherplex.contract(getCTokenBatchName(pool.prizePool.address, pool.tokens.cToken.address), CTokenAbi__default['default'], pool.tokens.cToken.address);
      batchCalls.push(cTokenContract.supplyRatePerBlock());
    } // LootBox


    const lootBoxAddress = (_contractAddresses$ch = currentPoolData.contractAddresses[chainId]) === null || _contractAddresses$ch === void 0 ? void 0 : (_contractAddresses$ch2 = _contractAddresses$ch.lootBox) === null || _contractAddresses$ch2 === void 0 ? void 0 : _contractAddresses$ch2.toLowerCase();

    if (lootBoxAddress && pool.prize.externalErc721Awards.length > 0) {
      const lootBox = pool.prize.externalErc721Awards.find(erc721 => erc721.address === lootBoxAddress);

      if (lootBox) {
        const lootBoxControllerAddress = currentPoolData.contractAddresses[chainId].lootBoxController;
        lootBox.tokenIds.forEach(tokenId => {
          const lootBoxControllerContract = etherplex.contract(getLootBoxBatchName(lootBoxAddress, tokenId), LootBoxControllerAbi__default['default'], lootBoxControllerAddress);
          batchCalls.push(lootBoxControllerContract.computeAddress(lootBoxAddress, tokenId));
        });
      }
    } // Reserve Registry


    const registryAddress = pool.reserve.registry.address;

    if (registryAddress !== ethers.ethers.constants.AddressZero) {
      const registryContract = etherplex.contract(getRegistryBatchName(registryAddress, pool.prizePool.address), RegistryAbi__default['default'], registryAddress);
      batchCalls.push(registryContract.lookup());
    }
  }); // First big batch call

  const firstBatchValues = await cloudflareWorkersBatch.batch(chainId, fetch, ...batchCalls);
  batchCalls = []; // Second set of calls

  poolGraphData.forEach(graphPool => {
    var _firstBatchValues$poo, _pool, _pool$tokenListener, _firstBatchValues$poo2, _pool$prize$sablierSt;

    pool = getPool(graphPool); // Prize Pool

    const prizePoolContract = etherplex.contract(pool.prizePool.address, PrizePoolAbi__default['default'], pool.prizePool.address); // Must be called in a separate multi-call from `captureAwardBalance`

    batchCalls.push(prizePoolContract.reserveTotalSupply()); // Token faucet drip asset

    const tokenFaucetDripAssetAddress = (_firstBatchValues$poo = firstBatchValues[(_pool = pool) === null || _pool === void 0 ? void 0 : (_pool$tokenListener = _pool.tokenListener) === null || _pool$tokenListener === void 0 ? void 0 : _pool$tokenListener.address]) === null || _firstBatchValues$poo === void 0 ? void 0 : _firstBatchValues$poo.asset[0];

    if (tokenFaucetDripAssetAddress) {
      const dripErc20Contract = etherplex.contract(getExternalErc20AwardBatchName(pool.prizePool.address, tokenFaucetDripAssetAddress), ERC20Abi.ERC20Abi, tokenFaucetDripAssetAddress);
      batchCalls.push(dripErc20Contract.balanceOf(pool.tokenListener.address).decimals().symbol().name());
    } // Sablier


    const sablierErc20StreamTokenAddress = firstBatchValues === null || firstBatchValues === void 0 ? void 0 : (_firstBatchValues$poo2 = firstBatchValues[(_pool$prize$sablierSt = pool.prize.sablierStream) === null || _pool$prize$sablierSt === void 0 ? void 0 : _pool$prize$sablierSt.id]) === null || _firstBatchValues$poo2 === void 0 ? void 0 : _firstBatchValues$poo2.getStream.tokenAddress;

    if (sablierErc20StreamTokenAddress) {
      var _pool$prize$sablierSt2;

      // TODO: Add sablier to contract addresses package
      const sablierErc20Stream = etherplex.contract(getSablierErc20BatchName(pool.prizePool.address, (_pool$prize$sablierSt2 = pool.prize.sablierStream) === null || _pool$prize$sablierSt2 === void 0 ? void 0 : _pool$prize$sablierSt2.id), ERC20Abi.ERC20Abi, sablierErc20StreamTokenAddress);
      batchCalls.push(sablierErc20Stream.decimals().name().symbol());
    } // Reserve


    const registryAddress = pool.reserve.registry.address;

    if (registryAddress !== ethers.ethers.constants.AddressZero) {
      const reserveAddress = firstBatchValues === null || firstBatchValues === void 0 ? void 0 : firstBatchValues[getRegistryBatchName(registryAddress, pool.prizePool.address)].lookup[0];
      const reserveContract = etherplex.contract(getReserveBatchName(reserveAddress, pool.prizePool.address), ReserveAbi__default['default'], reserveAddress);
      batchCalls.push(reserveContract.reserveRateMantissa(pool.prizePool.address));
    }
  });
  const secondBatchValues = await cloudflareWorkersBatch.batch(chainId, fetch, ...batchCalls); // Get External Erc721 Metadata (unfortunately many batch calls)

  const additionalBatchedCalls = await Promise.all([...erc721AwardsToFetchMetadataFor.map(async erc721Award => ({
    id: getErc721BatchName(erc721Award.address, erc721Award.tokenId),
    uri: await getErc721TokenUri(chainId, fetch, erc721Award.address, erc721Award.tokenId)
  })), // TODO: Split award is only supported on some versions of prizeStrategies
  ...poolGraphData.map(async graphPool => {
    pool = getPool(graphPool);
    const prizeStrategyContract = etherplex.contract(pool.prizeStrategy.address, MultipleWinnersAbi__default['default'], pool.prizeStrategy.address);

    try {
      return {
        id: pool.prizeStrategy.address,
        data: await cloudflareWorkersBatch.batch(chainId, fetch, prizeStrategyContract.splitExternalErc20Awards())
      };
    } catch (e) {
      return null;
    }
  })]);
  return formatPoolChainData(chainId, poolGraphData, firstBatchValues, secondBatchValues, additionalBatchedCalls);
};

const getErc721TokenUri = async (chainId, fetch, erc721Address, tokenId) => {
  const erc721Contract = etherplex.contract(getErc721BatchName(erc721Address, tokenId), CustomERC721.CustomERC721Abi, erc721Address);
  let tokenURI = await _tryMetadataMethod(chainId, fetch, erc721Address, erc721Contract, tokenId, 'tokenURI');

  if (!tokenURI) {
    tokenURI = await _tryMetadataMethod(chainId, fetch, erc721Address, erc721Contract, tokenId, 'tokenMetadata');
  }

  return tokenURI;
};

const _tryMetadataMethod = async (chainId, fetch, contractAddress, etherplexTokenContract, tokenId, method) => {
  let tokenValues;

  try {
    tokenValues = await cloudflareWorkersBatch.batch(chainId, fetch, etherplexTokenContract[method](tokenId));
    return tokenValues[contractAddress][method][0];
  } catch (e) {
    console.warn("NFT with tokenId ".concat(tokenId, " likely does not support metadata using method: ").concat(method, "():"), e.message);
  }
};

const formatPoolChainData = (chainId, poolGraphData, firstBatchValues, secondBatchValues, additionalBatchCalls) => {
  // Format individual pool data
  const formattedPools = {};
  let pool;
  poolGraphData.forEach(graphPool => {
    var _additionalBatchCalls, _additionalBatchCalls2, _contractAddresses$ch3, _contractAddresses$ch4;

    pool = getPool(graphPool);
    const prizePoolAddress = pool.prizePool.address;
    const prizeStrategyAddress = pool.prizeStrategy.address;
    const prizeStrategyData = firstBatchValues[prizeStrategyAddress];
    const formattedPoolChainData = {
      config: {
        splitExternalErc20Awards: (_additionalBatchCalls = additionalBatchCalls.find(response => response.id === prizeStrategyAddress)) === null || _additionalBatchCalls === void 0 ? void 0 : (_additionalBatchCalls2 = _additionalBatchCalls.data) === null || _additionalBatchCalls2 === void 0 ? void 0 : _additionalBatchCalls2[prizeStrategyAddress].splitExternalErc20Awards[0]
      },
      prizePool: {},
      prize: {
        amount: units.formatUnits(firstBatchValues[prizePoolAddress].captureAwardBalance[0], pool.tokens.underlyingToken.decimals),
        amountUnformatted: firstBatchValues[prizePoolAddress].captureAwardBalance[0],
        isRngRequested: prizeStrategyData.isRngRequested[0],
        isRngCompleted: prizeStrategyData.isRngCompleted[0],
        canStartAward: prizeStrategyData.canStartAward[0],
        canCompleteAward: prizeStrategyData.canCompleteAward[0],
        prizePeriodStartedAt: prizeStrategyData.prizePeriodStartedAt[0],
        prizePeriodRemainingSeconds: prizeStrategyData.prizePeriodRemainingSeconds[0],
        prizePeriodSeconds: prizeStrategyData.prizePeriodSeconds[0],
        estimatedRemainingBlocksToPrize: units.formatUnits(prizeStrategyData.estimateRemainingBlocksToPrize[0], 18),
        estimatedRemainingBlocksToPrizeUnformatted: prizeStrategyData.estimateRemainingBlocksToPrize[0]
      },
      reserve: {
        amountUnformatted: secondBatchValues[prizePoolAddress].reserveTotalSupply[0],
        amount: units.formatUnits(secondBatchValues[prizePoolAddress].reserveTotalSupply[0], pool.tokens.underlyingToken.decimals)
      }
    }; // Token listener

    if (pool.tokenListener.address) {
      const tokenListenerData = firstBatchValues[pool.tokenListener.address];
      const tokenFaucetDripAssetAddress = tokenListenerData.asset[0];
      const tokenListenerData2 = secondBatchValues[getExternalErc20AwardBatchName(pool.prizePool.address, tokenFaucetDripAssetAddress)];
      const tokenFaucetDripToken = {
        address: tokenFaucetDripAssetAddress.toLowerCase(),
        amount: units.formatUnits(tokenListenerData2.balanceOf[0], tokenListenerData2.decimals[0]),
        amountUnformatted: tokenListenerData2.balanceOf[0],
        decimals: tokenListenerData2.decimals[0],
        name: tokenListenerData2.name[0],
        symbol: tokenListenerData2.symbol[0]
      };
      formattedPoolChainData.tokenListener = {
        dripRatePerSecondUnformatted: tokenListenerData.dripRatePerSecond[0],
        measure: tokenListenerData.measure[0]
      };
      formattedPoolChainData.tokenListener.dripRatePerSecond = units.formatUnits(formattedPoolChainData.tokenListener.dripRatePerSecondUnformatted, tokenFaucetDripToken.decimals);
      formattedPoolChainData.tokenListener.dripRatePerDayUnformatted = formattedPoolChainData.tokenListener.dripRatePerSecondUnformatted.mul(constants.SECONDS_PER_DAY);
      formattedPoolChainData.tokenListener.dripRatePerDay = units.formatUnits(formattedPoolChainData.tokenListener.dripRatePerDayUnformatted, tokenFaucetDripToken.decimals);
      formattedPoolChainData.tokens = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, formattedPoolChainData.tokens), {}, {
        tokenFaucetDripToken
      });
    } // External ERC20 awards
    // NOTE: editing pool graph data here to merge the token amounts in
    // This is undesirable as it goes against the pattern for merging poolChainData & poolGraphData
    // but it is the simplist way to merge the arrays.


    if (pool.prize.externalErc20Awards.length > 0) {
      pool.prize.externalErc20Awards = pool.prize.externalErc20Awards.filter(erc20 => {
        var _ERC20_BLOCK_LIST$cha;

        return !((_ERC20_BLOCK_LIST$cha = constants.ERC20_BLOCK_LIST[chainId]) !== null && _ERC20_BLOCK_LIST$cha !== void 0 && _ERC20_BLOCK_LIST$cha.includes(erc20.address.toLowerCase()));
      }).map(erc20 => {
        const erc20AwardData = firstBatchValues[getExternalErc20AwardBatchName(prizePoolAddress, erc20.address)];
        erc20.amount = units.formatUnits(erc20AwardData.balanceOf[0], erc20.decimals);
        erc20.amountUnformatted = erc20AwardData.balanceOf[0];
        return erc20;
      });
    } // External ERC721 awards
    // NOTE: editing pool graph data here to merge the token amounts in
    // This is undesirable as it goes against the pattern for merging poolChainData & poolGraphData
    // but it is the simplist way to merge the arrays.


    if (pool.prize.externalErc721Awards.length > 0) {
      pool.prize.externalErc721Awards = pool.prize.externalErc721Awards.map(erc721 => erc721.tokenIds.map(tokenId => {
        var _additionalBatchCalls3;

        const erc721Uri = (_additionalBatchCalls3 = additionalBatchCalls.find(response => response.id === getErc721BatchName(erc721.address, tokenId))) === null || _additionalBatchCalls3 === void 0 ? void 0 : _additionalBatchCalls3.uri;
        const erc721AwardData = firstBatchValues[getErc721BatchName(erc721.address, tokenId)];

        const erc721Award = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, erc721), {}, {
          amount: erc721AwardData.balanceOf[0],
          id: tokenId,
          uri: erc721Uri
        });

        delete erc721Award.tokenIds;
        return erc721Award;
      })).flat();
    } // Sablier


    if (pool.prize.sablierStream.id) {
      const sablierStreamData = firstBatchValues[pool.prize.sablierStream.id];
      const sablierStreamTokenData = secondBatchValues[getSablierErc20BatchName(prizePoolAddress, pool.prize.sablierStream.id)];
      const sablierStreamToken = {
        address: sablierStreamData.getStream.tokenAddress.toLowerCase(),
        name: sablierStreamTokenData.name[0],
        decimals: sablierStreamTokenData.decimals[0],
        symbol: sablierStreamTokenData.symbol[0]
      };
      formattedPoolChainData.prize.sablierStream = {
        deposit: sablierStreamData.getStream.deposit,
        ratePerSecond: sablierStreamData.getStream.ratePerSecond,
        remainingBalance: sablierStreamData.getStream.remainingBalance,
        startTime: sablierStreamData.getStream.startTime,
        stopTime: sablierStreamData.getStream.stopTime
      };
      formattedPoolChainData.tokens = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, formattedPoolChainData.tokens), {}, {
        sablierStreamToken
      });
    } // cToken


    if (pool.tokens.cToken) {
      var _formattedPoolChainDa;

      const cTokenData = firstBatchValues[getCTokenBatchName(pool.prizePool.address, pool.tokens.cToken.address)];
      formattedPoolChainData.tokens = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, formattedPoolChainData.tokens), {}, {
        cToken: _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, formattedPoolChainData === null || formattedPoolChainData === void 0 ? void 0 : (_formattedPoolChainDa = formattedPoolChainData.tokens) === null || _formattedPoolChainDa === void 0 ? void 0 : _formattedPoolChainDa.cToken), {}, {
          supplyRatePerBlock: cTokenData.supplyRatePerBlock[0]
        })
      });
    } // LootBox


    const lootBoxAddress = (_contractAddresses$ch3 = currentPoolData.contractAddresses[chainId]) === null || _contractAddresses$ch3 === void 0 ? void 0 : (_contractAddresses$ch4 = _contractAddresses$ch3.lootBox) === null || _contractAddresses$ch4 === void 0 ? void 0 : _contractAddresses$ch4.toLowerCase();

    if (lootBoxAddress && pool.prize.externalErc721Awards.length > 0) {
      const lootBoxes = remove__default['default'](pool.prize.externalErc721Awards, erc721 => erc721.address === lootBoxAddress);

      if (lootBoxes) {
        const lootBoxId = lootBoxes[0].id;
        const computedAddress = firstBatchValues[getLootBoxBatchName(lootBoxAddress, lootBoxId)].computeAddress[0];
        formattedPoolChainData.prize.lootBox = {
          address: computedAddress,
          id: lootBoxId
        };
      }
    } // Reserve


    const registryAddress = pool.reserve.registry.address;

    if (registryAddress !== ethers.ethers.constants.AddressZero) {
      const reserveAddress = firstBatchValues[getRegistryBatchName(registryAddress, pool.prizePool.address)].lookup[0];
      formattedPoolChainData.reserve = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, formattedPoolChainData.reserve), {}, {
        address: reserveAddress,
        rate: units.formatUnits(secondBatchValues[getReserveBatchName(reserveAddress, prizePoolAddress)].reserveRateMantissa[0], constants.DEFAULT_TOKEN_PRECISION),
        rateUnformatted: secondBatchValues[getReserveBatchName(reserveAddress, prizePoolAddress)].reserveRateMantissa[0]
      });
    }

    formattedPools[prizePoolAddress] = formattedPoolChainData;
  });
  return formattedPools;
};

exports.getPoolChainData = getPoolChainData;
