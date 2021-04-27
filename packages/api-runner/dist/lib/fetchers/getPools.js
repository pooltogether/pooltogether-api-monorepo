'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var merge = require('lodash.merge');
var cloneDeep = require('lodash.clonedeep');
var ethers = require('ethers');
var units = require('@ethersproject/units');
var utilities = require('@pooltogether/utilities');
var constants = require('../constants.js');
var getTokenPriceData = require('./getTokenPriceData.js');
require('../services/calculateEstimatedPoolPrize.js');
var getGraphLootBoxData = require('./getGraphLootBoxData.js');
var stringWithPrecision = require('../utils/stringWithPrecision.js');
var secondsSinceEpoch = require('../utils/secondsSinceEpoch.js');
var getPoolGraphData = require('./getPoolGraphData.js');
var getPoolChainData = require('./getPoolChainData.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var merge__default = /*#__PURE__*/_interopDefaultLegacy(merge);
var cloneDeep__default = /*#__PURE__*/_interopDefaultLegacy(cloneDeep);

const MAINNET_USD_AMOUNT = 0;
const TESTNET_USD_AMOUNT = 1;
const TESTNET_CHAIN_IDS = [3, 4, 5, 42, 80001];
const bn = ethers.ethers.BigNumber.from;

const getPool = graphPool => {
  const poolAddressKey = Object.keys(graphPool)[0];
  return graphPool[poolAddressKey];
};
/**
 *
 * @param {*} chainId
 * @param {*} readProvider
 * @param {*} poolContracts
 * @returns
 */


const getPools = async (chainId, poolContracts, fetch) => {
  const poolGraphData = await getPoolGraphData.getPoolGraphData(chainId, poolContracts, fetch);
  const poolChainData = await getPoolChainData.getPoolChainData(chainId, poolGraphData, fetch);
  let pools = combinePoolData(poolGraphData, poolChainData);
  const lootBoxTokenIds = [...new Set(pools.map(pool => {
    var _pool$prize$lootBox;

    return (_pool$prize$lootBox = pool.prize.lootBox) === null || _pool$prize$lootBox === void 0 ? void 0 : _pool$prize$lootBox.id;
  }).filter(Boolean))];
  const lootBoxData = await getGraphLootBoxData.getGraphLootBoxData(chainId, lootBoxTokenIds, fetch);
  pools = combineLootBoxData(chainId, pools, lootBoxData);
  const erc20Addresses = getAllErc20Addresses(pools);
  const tokenPriceGraphData = await getTokenPriceData.getTokenPriceData(chainId, erc20Addresses, fetch);
  const defaultTokenPriceUsd = TESTNET_CHAIN_IDS.includes(chainId) ? TESTNET_USD_AMOUNT : MAINNET_USD_AMOUNT;
  pools = combineTokenPricesData(pools, tokenPriceGraphData, defaultTokenPriceUsd);
  pools = await Promise.all(await calculateTotalPrizeValuePerPool(pools, fetch));
  pools = calculateTotalValueLockedPerPool(pools);
  pools = calculateTokenFaucetApr(pools);
  pools = addPoolMetadata(pools, poolContracts);
  return pools;
};
/**
 * Merges poolGraphData & poolChainData
 * poolGraphData & poolChainData are pre-formatted
 * @param {*} poolGraphData
 * @param {*} poolChainData
 * @returns
 */

const combinePoolData = (poolGraphData, poolChainData) => {
  let pool;
  const pools = poolGraphData.map(graphPool => {
    pool = getPool(graphPool);
    const chainData = poolChainData[pool.prizePool.address];
    return merge__default['default'](pool, chainData);
  });
  return pools;
};
/**
 * Adds loot box data to each pool
 * @param {*} chainId
 * @param {*} _pools
 * @param {*} lootBoxData
 * @returns
 */


const combineLootBoxData = (chainId, _pools, lootBoxData) => {
  const pools = cloneDeep__default['default'](_pools);
  pools.forEach(pool => combineLootBoxDataWithPool(chainId, pool, lootBoxData));
  return pools;
};
/**
 * Adds loot box data to a single pool
 * @param {*} chainId
 * @param {*} pool
 * @param {*} lootBoxData
 * @returns
 */


const combineLootBoxDataWithPool = (chainId, pool, lootBoxData) => {
  var _lootBoxData$lootBoxe;

  if (((_lootBoxData$lootBoxe = lootBoxData.lootBoxes) === null || _lootBoxData$lootBoxe === void 0 ? void 0 : _lootBoxData$lootBoxe.length) > 0) {
    if (!pool.prize.lootBox) return;
    const lootBoxGraphData = lootBoxData.lootBoxes.find(lootBox => lootBox.tokenId === pool.prize.lootBox.id);
    if (!lootBoxGraphData) return;
    const formattedLootBox = formatLootBox(chainId, lootBoxGraphData);
    pool.prize.lootBox = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, pool.prize.lootBox), formattedLootBox);
  }
};
/**
 * Formats the data returned from the graph for a lootBox
 * @param {*} chainId
 * @param {*} lootBoxGraphData
 * @returns
 */

const formatLootBox = (chainId, lootBoxGraphData) => ({
  erc1155Tokens: lootBoxGraphData.erc1155Balances,
  erc721Tokens: lootBoxGraphData.erc721Tokens,
  erc20Tokens: lootBoxGraphData.erc20Balances.filter(erc20 => {
    var _ERC20_BLOCK_LIST$cha;

    return !((_ERC20_BLOCK_LIST$cha = constants.ERC20_BLOCK_LIST[chainId]) !== null && _ERC20_BLOCK_LIST$cha !== void 0 && _ERC20_BLOCK_LIST$cha.includes(erc20.erc20Entity.id.toLowerCase()));
  }).map(erc20 => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, erc20.erc20Entity), {}, {
    address: erc20.erc20Entity.id,
    lootBoxAddress: erc20.erc20Entity.id,
    amountUnformatted: bn(erc20.balance),
    amount: units.formatUnits(erc20.balance, erc20.erc20Entity.decimals)
  }))
});
/**
 * Gets all erc20 addresses related to a pool
 * @param {*} pools
 * @returns Array of addresses
 */

const getAllErc20Addresses = pools => {
  const addresses = new Set();
  pools.forEach(pool => {
    var _pool$prize$lootBox2, _pool$prize$lootBox2$;

    // Get external erc20s
    pool.prize.externalErc20Awards.forEach(erc20 => addresses.add(erc20.address)); // Get lootbox erc20s

    (_pool$prize$lootBox2 = pool.prize.lootBox) === null || _pool$prize$lootBox2 === void 0 ? void 0 : (_pool$prize$lootBox2$ = _pool$prize$lootBox2.erc20Tokens) === null || _pool$prize$lootBox2$ === void 0 ? void 0 : _pool$prize$lootBox2$.forEach(erc20 => addresses.add(erc20.address)); // Get known tokens

    Object.values(pool.tokens).forEach(erc20 => addresses.add(erc20.address));
  });
  return [...addresses];
};
/**
 * Adds token price data to pools
 * @param {*} _pools
 * @param {*} tokenPriceData
 */


const combineTokenPricesData = (_pools, tokenPriceData, defaultTokenPriceUsd) => {
  const pools = cloneDeep__default['default'](_pools);
  pools.forEach(pool => {
    var _pool$prize$lootBox3, _pool$prize$lootBox3$;

    // Add to all known tokens
    Object.values(pool.tokens).forEach(token => addTokenTotalUsdValue(token, tokenPriceData, defaultTokenPriceUsd)); // Add to all external erc20 tokens

    Object.values(pool.prize.externalErc20Awards).forEach(token => addTokenTotalUsdValue(token, tokenPriceData, defaultTokenPriceUsd)); // Add to all lootBox tokens

    (_pool$prize$lootBox3 = pool.prize.lootBox) === null || _pool$prize$lootBox3 === void 0 ? void 0 : (_pool$prize$lootBox3$ = _pool$prize$lootBox3.erc20Tokens) === null || _pool$prize$lootBox3$ === void 0 ? void 0 : _pool$prize$lootBox3$.forEach(token => addTokenTotalUsdValue(token, tokenPriceData, defaultTokenPriceUsd)); // Add total values for controlled tokens

    const underlyingToken = pool.tokens.underlyingToken;
    addTotalValueForControlledTokens(pool.tokens.ticket, underlyingToken);
    addTotalValueForControlledTokens(pool.tokens.sponsorship, underlyingToken); // Add total values for reserves

    addTotalValueForReserve(pool);
  });
  return pools;
};
/**
 * Adds token USD value if we have the USD price per token
 * @param {*} token
 */


const addTokenTotalUsdValue = (token, tokenPriceData, defaultTokenPriceUsd) => {
  const priceData = tokenPriceData[token.address];

  if (priceData) {
    token.usd = tokenPriceData[token.address].usd || defaultTokenPriceUsd;
    token.derivedETH = tokenPriceData[token.address].derivedETH || defaultTokenPriceUsd.toString();

    if (token.amountUnformatted) {
      const usdValueUnformatted = amountMultByUsd(token.amountUnformatted, token.usd);
      token.totalValueUsd = units.formatUnits(usdValueUnformatted, token.decimals);
      token.totalValueUsdScaled = toScaledUsdBigNumber(token.totalValueUsd);
    }
  } else {
    token.usd = defaultTokenPriceUsd;
    token.derivedETH = defaultTokenPriceUsd.toString();
  }
};
/**
 * Mutates reserve to have the total values
 * @param {*} pool
 */

const addTotalValueForReserve = pool => {
  const underlyingToken = pool.tokens.underlyingToken;
  const amountUnformatted = pool.reserve.amountUnformatted;

  if (amountUnformatted) {
    const totalValueUsdUnformatted = amountMultByUsd(amountUnformatted, underlyingToken.usd);
    pool.reserve.totalValueUsd = units.formatUnits(totalValueUsdUnformatted, underlyingToken.decimals);
    pool.reserve.totalValueUsdScaled = toScaledUsdBigNumber(pool.reserve.totalValueUsd);
  }
};
/**
 * Need to mult & div by 100 since BigNumber doesn't support decimals
 * @param {*} amount as a BigNumber
 * @param {*} usd as a Number
 * @returns a BigNumber
 */


const amountMultByUsd = (amount, usd) => amount.mul(Math.round(usd * 100)).div(100);
/**
 * Calculate total prize value
 * Estimate final prize if yield is compound
 * Total prize is:
 *  External award values
 *  + LootBox value
 *  + Estimated Yield by end of prize period (or just current balance if we can't estimate)
 * TODO: For per winner calculations: doesn't account for external erc20 awards
 * that are the yield token. I think those get split as well
 * TODO: Assumes sablier stream is the same as the "yield" token for calculations
 * @param {*} pools
 */


const calculateTotalPrizeValuePerPool = async (pools, fetch) => {
  return pools.map(async _pool => {
    var _pool$prize$yield, _pool$prize$yield$com;

    let pool = cloneDeep__default['default'](_pool); // Calculate erc20 values

    pool = calculateExternalErc20TotalValuesUsd(pool); // Calculate lootBox award value

    pool = calculateLootBoxTotalValuesUsd(pool); // Calculate yield prize

    pool = await calculateYieldTotalValuesUsd(pool, fetch); // Calculate sablier prize

    pool = calculateSablierTotalValueUsd(pool); // Calculate total

    pool.prize.totalExternalAwardsValueUsdScaled = utilities.addBigNumbers([pool.prize.lootBox.totalValueUsdScaled, pool.prize.erc20Awards.totalValueUsdScaled, (_pool$prize$yield = pool.prize.yield) === null || _pool$prize$yield === void 0 ? void 0 : (_pool$prize$yield$com = _pool$prize$yield.comp) === null || _pool$prize$yield$com === void 0 ? void 0 : _pool$prize$yield$com.totalValueUsdScaled].filter(Boolean));
    pool.prize.totalExternalAwardsValueUsd = units.formatUnits(pool.prize.totalExternalAwardsValueUsdScaled, 2);
    pool.prize.totalInternalAwardsUsdScaled = utilities.addBigNumbers([pool.prize.yield.totalValueUsdScaled, pool.prize.sablierStream.totalValueUsdScaled]);
    pool.prize.totalInternalAwardsUsd = units.formatUnits(pool.prize.totalInternalAwardsUsdScaled, 2);
    pool.prize.totalValueUsdScaled = utilities.addBigNumbers([pool.prize.totalInternalAwardsUsdScaled, pool.prize.totalExternalAwardsValueUsdScaled]);
    pool.prize.totalValueUsd = units.formatUnits(pool.prize.totalValueUsdScaled, 2);

    if (pool.config.splitExternalErc20Awards) {
      const total = pool.prize.totalValueUsdScaled;
      calculatePerWinnerPrizes(pool, total);
    } else {
      const total = pool.prize.totalInternalAwardsUsdScaled;
      calculatePerWinnerPrizes(pool, total);
    }

    return pool;
  });
};
/**
 * Calculates the prize for each winner (grand prize & runner up(s))
 * @param {*} pool
 * @param {*} totalToBeSplit
 */


const calculatePerWinnerPrizes = (pool, totalToBeSplit) => {
  pool.prize.totalValuePerWinnerUsdScaled = totalToBeSplit.div(pool.config.numberOfWinners);
  pool.prize.totalValuePerWinnerUsd = units.formatUnits(pool.prize.totalValuePerWinnerUsdScaled, 2);
  pool.prize.totalValueGrandPrizeWinnerUsdScaled = utilities.addBigNumbers([pool.prize.totalValuePerWinnerUsdScaled, pool.prize.lootBox.totalValueUsdScaled, pool.prize.erc20Awards.totalValueUsdScaled]);
  pool.prize.totalValueGrandPrizeWinnerUsd = units.formatUnits(pool.prize.totalValueGrandPrizeWinnerUsdScaled, 2);
};
/**
 * Calculates the total values for all external erc20 tokens
 * @param {*} _pool
 * @returns
 */


const calculateExternalErc20TotalValuesUsd = _pool => {
  const pool = cloneDeep__default['default'](_pool);
  const externalErc20TotalValueUsdScaled = Object.values(pool.prize.externalErc20Awards).reduce(addScaledTokenValueToTotal, ethers.ethers.constants.Zero);
  pool.prize.erc20Awards = {
    totalValueUsdScaled: externalErc20TotalValueUsdScaled,
    totalValueUsd: units.formatUnits(externalErc20TotalValueUsdScaled, 2)
  };
  return pool;
};
/**
 * Mutates the token (ticket or sponsorship) to have total USD values
 * @param {*} token
 * @param {*} underlyingToken
 */


const addTotalValueForControlledTokens = (token, underlyingToken) => {
  if (token.totalSupplyUnformatted) {
    const totalValueUsdUnformatted = amountMultByUsd(token.totalSupplyUnformatted, underlyingToken.usd);
    token.usd = underlyingToken.usd;
    token.derivedETH = underlyingToken.derivedETH;
    token.totalValueUsd = units.formatUnits(totalValueUsdUnformatted, token.decimals);
    token.totalValueUsdScaled = toScaledUsdBigNumber(token.totalValueUsd);
  }
};
/**
 * Calculates the total value of all erc20 tokens in the loot box
 * @param {*} _pool
 * @returns
 */


const calculateLootBoxTotalValuesUsd = _pool => {
  var _pool$prize$lootBox4, _pool$prize$lootBox4$;

  const pool = cloneDeep__default['default'](_pool);
  const lootBoxTotalValueUsdScaled = ((_pool$prize$lootBox4 = pool.prize.lootBox) === null || _pool$prize$lootBox4 === void 0 ? void 0 : (_pool$prize$lootBox4$ = _pool$prize$lootBox4.erc20Tokens) === null || _pool$prize$lootBox4$ === void 0 ? void 0 : _pool$prize$lootBox4$.reduce(addScaledTokenValueToTotal, ethers.ethers.constants.Zero)) || ethers.ethers.constants.Zero;

  if (!pool.prize.lootBox) {
    pool.prize.lootBox = {
      id: null
    };
  }

  pool.prize.lootBox.totalValueUsdScaled = lootBoxTotalValueUsdScaled;
  pool.prize.lootBox.totalValueUsd = units.formatUnits(lootBoxTotalValueUsdScaled, 2);
  return pool;
};
/**
 * Calculates the total yield values, $0 if no yield or no token prices
 * @param {*} _pool
 * @returns
 */


const calculateYieldTotalValuesUsd = async (_pool, fetch) => {
  const pool = cloneDeep__default['default'](_pool);
  const cToken = pool.tokens.cToken;
  const underlyingToken = pool.tokens.underlyingToken;
  let compApy = '0';
  let yieldAmountUnformatted = pool.prize.amountUnformatted;

  if (cToken) {
    try {
      var _response$cToken$, _pool$reserve;

      // Calculate value of COMP
      const cTokenData = await fetch('https://api.compound.finance/api/v2/ctoken', {
        method: 'POST',
        body: JSON.stringify({
          addresses: [cToken.address]
        })
      });
      const response = await cTokenData.json();
      compApy = ((_response$cToken$ = response.cToken[0]) === null || _response$cToken$ === void 0 ? void 0 : _response$cToken$.comp_supply_apy.value) || '0';
      const totalCompValueUsdUnformatted = utilities.calculatedEstimatedAccruedCompValueUnformatted(compApy, pool.tokens.ticket.totalSupplyUnformatted.add(pool.tokens.sponsorship.totalSupplyUnformatted), pool.prize.prizePeriodRemainingSeconds);
      const totalValueUsd = ethers.ethers.utils.formatUnits(totalCompValueUsdUnformatted, underlyingToken.decimals);
      pool.prize.yield = {
        comp: {
          totalValueUsd,
          totalValueUsdScaled: toScaledUsdBigNumber(totalValueUsd)
        }
      }; // Calculate yield

      yieldAmountUnformatted = utilities.calculateEstimatedCompoundPrizeWithYieldUnformatted(pool.prize.amountUnformatted, pool.tokens.ticket.totalSupplyUnformatted.add(pool.tokens.sponsorship.totalSupplyUnformatted), cToken.supplyRatePerBlock, pool.tokens.ticket.decimals, pool.prize.estimatedRemainingBlocksToPrize, (_pool$reserve = pool.reserve) === null || _pool$reserve === void 0 ? void 0 : _pool$reserve.rate);
    } catch (e) {
      console.warn(e.message);
    }
  }

  const yieldAmount = ethers.ethers.utils.formatUnits(yieldAmountUnformatted, underlyingToken.decimals);
  const yieldAmountFormattedString = stringWithPrecision.stringWithPrecision(yieldAmount, {
    precision: pool.tokens.underlyingToken.decimals - 1
  });
  pool.prize.yield = pool.prize.yield ? _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, pool.prize.yield), {}, {
    amount: yieldAmountFormattedString
  }) : {
    amount: yieldAmountFormattedString
  };
  pool.prize.yield.amountUnformatted = units.parseUnits(pool.prize.yield.amount, pool.tokens.underlyingToken.decimals);
  const yieldTotalValueUnformatted = amountMultByUsd(pool.prize.yield.amountUnformatted, pool.tokens.underlyingToken.usd);
  pool.prize.yield.totalValueUsd = units.formatUnits(yieldTotalValueUnformatted, pool.tokens.underlyingToken.decimals);
  pool.prize.yield.totalValueUsdScaled = toScaledUsdBigNumber(pool.prize.yield.totalValueUsd);
  return pool;
};
/**
 * Calculates the total values for the Sablier stream if there is one
 * Otherwise returns values as $0
 * @param {*} _pool
 * @returns
 */


const calculateSablierTotalValueUsd = _pool => {
  var _pool$prize$sablierSt;

  const pool = cloneDeep__default['default'](_pool);

  if (!((_pool$prize$sablierSt = pool.prize.sablierStream) !== null && _pool$prize$sablierSt !== void 0 && _pool$prize$sablierSt.id)) {
    pool.prize.sablierStream = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, pool.prize.sablierStream), {}, {
      totalValueUsd: ethers.ethers.constants.Zero,
      totalValueUsdScaled: ethers.ethers.constants.Zero
    });
    return pool;
  }

  const _pool$prize$sablierSt2 = pool.prize.sablierStream,
        startTime = _pool$prize$sablierSt2.startTime,
        stopTime = _pool$prize$sablierSt2.stopTime,
        ratePerSecond = _pool$prize$sablierSt2.ratePerSecond;
  const _pool$prize = pool.prize,
        prizePeriodStartedAt = _pool$prize.prizePeriodStartedAt,
        prizePeriodSeconds = _pool$prize.prizePeriodSeconds,
        isRngRequested = _pool$prize.isRngRequested;
  const prizePeriodEndsAt = prizePeriodStartedAt.add(prizePeriodSeconds);
  const currentTime = ethers.ethers.BigNumber.from(secondsSinceEpoch.secondsSinceEpoch()); // Stream hasn't started yet

  if (prizePeriodEndsAt.lt(startTime)) {
    pool.prize.sablierStream = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, pool.prize.sablierStream), {}, {
      totalValueUsd: ethers.ethers.constants.Zero,
      totalValueUsdScaled: ethers.ethers.constants.Zero
    });
    return pool;
  }

  const streamEndsAfterPrizePeriod = stopTime.gt(prizePeriodEndsAt);
  const prizePeriodFinished = currentTime.gt(prizePeriodEndsAt);
  const streamStartedAfterPrizePool = startTime.gte(prizePeriodStartedAt);
  let dripEnd; // If people take too long to award the prize, the stream will be added to that earlier prize

  if (streamEndsAfterPrizePeriod && prizePeriodFinished && !isRngRequested) {
    const streamHasEnded = stopTime.lte(currentTime);
    dripEnd = streamHasEnded ? stopTime : currentTime;
  } else {
    const streamHasEnded = stopTime.lte(prizePeriodEndsAt);
    dripEnd = streamHasEnded ? stopTime : prizePeriodEndsAt;
  }

  const dripStart = streamStartedAfterPrizePool ? startTime : prizePeriodStartedAt;
  const dripTime = dripEnd.sub(dripStart);
  const amountThisPrizePeriodUnformatted = dripTime.mul(ratePerSecond);
  const amountThisPrizePeriod = units.formatUnits(amountThisPrizePeriodUnformatted, pool.tokens.sablierStreamToken.decimals);
  const amountPerPrizePeriodUnformatted = prizePeriodSeconds.mul(ratePerSecond);
  const amountPerPrizePeriod = units.formatUnits(amountPerPrizePeriodUnformatted, pool.tokens.sablierStreamToken.decimals);
  const totalValueUsdUnformatted = amountMultByUsd(amountThisPrizePeriodUnformatted, pool.tokens.sablierStreamToken.usd);
  const totalValueUsd = units.formatUnits(totalValueUsdUnformatted, pool.tokens.sablierStreamToken.decimals);
  const totalValueUsdScaled = toScaledUsdBigNumber(totalValueUsd);
  pool.prize.sablierStream = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, pool.prize.sablierStream), {}, {
    amountUnformatted: pool.prize.sablierStream.deposit,
    amount: units.formatUnits(pool.prize.sablierStream.deposit, pool.tokens.sablierStreamToken.decimals),
    amountThisPrizePeriodUnformatted,
    amountThisPrizePeriod,
    amountPerPrizePeriodUnformatted,
    amountPerPrizePeriod,
    totalValueUsd,
    totalValueUsdScaled
  });
  return pool;
};
/**
 * Scaled math that adds the USD value of a token if it is available
 * Math is done scaled up to keep the value of the cents when using BigNumbers
 * @param {*} total
 * @param {*} token
 * @returns
 */


const addScaledTokenValueToTotal = (total, token) => {
  if (token.totalValueUsdScaled) {
    return total.add(token.totalValueUsdScaled);
  }

  return total;
};
/**
 * Converts a USD string to a scaled up big number to account for cents
 * @param {*} usdValue a String ex. "100.23"
 * @returns a BigNumber ex. 10023
 */


const toScaledUsdBigNumber = usdValue => units.parseUnits(stringWithPrecision.stringWithPrecision(usdValue, {
  precision: 2
}), 2);
/**
 * Calculates & adds the tvl of each pool to pools
 * Calculates the tvl of all pools
 * @param {*} pools
 * @returns tvl of all pools
 */


const calculateTotalValueLockedPerPool = pools => pools.map(_pool => {
  const pool = cloneDeep__default['default'](_pool);

  if (pool.tokens.underlyingToken.usd && pool.tokens.ticket.totalSupplyUnformatted) {
    const totalAmountDepositedUnformatted = pool.tokens.ticket.totalSupplyUnformatted.add(pool.tokens.sponsorship.totalSupplyUnformatted);
    const totalValueLockedUsdUnformatted = amountMultByUsd(totalAmountDepositedUnformatted, pool.tokens.underlyingToken.usd);
    const tvlTicketsUsdUnformatted = amountMultByUsd(pool.tokens.ticket.totalSupplyUnformatted, pool.tokens.underlyingToken.usd);
    const tvlSponsorshipUsdUnformatted = amountMultByUsd(pool.tokens.sponsorship.totalSupplyUnformatted, pool.tokens.underlyingToken.usd);
    pool.prizePool.totalValueLockedUsd = units.formatUnits(totalValueLockedUsdUnformatted, pool.tokens.ticket.decimals);
    pool.prizePool.totalValueLockedUsdScaled = toScaledUsdBigNumber(pool.prizePool.totalValueLockedUsd);
    pool.prizePool.totalTicketValueLockedUsd = units.formatUnits(tvlTicketsUsdUnformatted, pool.tokens.ticket.decimals);
    pool.prizePool.totalTicketValueLockedUsdScaled = toScaledUsdBigNumber(pool.prizePool.totalTicketValueLockedUsd);
    pool.prizePool.totalSponsorshipValueLockedUsd = units.formatUnits(tvlSponsorshipUsdUnformatted, pool.tokens.ticket.decimals);
    pool.prizePool.totalSponsorshipValueLockedUsdScaled = toScaledUsdBigNumber(pool.prizePool.totalSponsorshipValueLockedUsd);
  } else {
    pool.prizePool.totalValueLockedUsd = '0';
    pool.prizePool.totalValueLockedUsdScaled = ethers.ethers.constants.Zero;
  }

  return pool;
});
/**
 *
 * @param {*} pools
 * @returns
 */


const calculateTokenFaucetApr = pools => pools.map(_pool => {
  var _pool$tokens$tokenFau;

  const pool = cloneDeep__default['default'](_pool);

  if ((_pool$tokens$tokenFau = pool.tokens.tokenFaucetDripToken) !== null && _pool$tokens$tokenFau !== void 0 && _pool$tokens$tokenFau.usd) {
    const _pool$tokens$tokenFau2 = pool.tokens.tokenFaucetDripToken,
          amountUnformatted = _pool$tokens$tokenFau2.amountUnformatted,
          usd = _pool$tokens$tokenFau2.usd;

    if (amountUnformatted === ethers.ethers.constants.Zero) ; else {
      const dripRatePerSecond = pool.tokenListener.dripRatePerSecond;
      const totalDripPerDay = Number(dripRatePerSecond) * constants.SECONDS_PER_DAY;
      const totalDripDailyValue = totalDripPerDay * usd;
      const totalTicketValueUsd = Number(pool.prizePool.totalTicketValueLockedUsd);
      pool.tokenListener.apr = totalDripDailyValue / totalTicketValueUsd * 365 * 100;
    }
  }

  return pool;
});
/**
 * Adds contract metadata to the pools
 * @param {*} _pools
 * @param {*} poolContracts
 */


const addPoolMetadata = (_pools, poolContracts) => {
  const pools = cloneDeep__default['default'](_pools);
  poolContracts.forEach(contract => {
    const pool = pools.find(pool => pool.prizePool.address === contract.prizePool.address);
    if (!pool) return;
    pool.name = "".concat(pool.tokens.underlyingToken.symbol, " Pool");
    pool.contract = contract;
    pool.symbol = contract.symbol;
  });
  return pools;
};

exports.addTokenTotalUsdValue = addTokenTotalUsdValue;
exports.combineLootBoxDataWithPool = combineLootBoxDataWithPool;
exports.formatLootBox = formatLootBox;
exports.getPools = getPools;
