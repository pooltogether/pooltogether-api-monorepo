import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import { ethers } from 'ethers'
import { formatUnits, parseUnits } from '@ethersproject/units'

import { ERC20_BLOCK_LIST, SECONDS_PER_DAY } from 'lib/constants'
import { getTokenPriceData } from 'lib/fetchers/getTokenPriceData'
import { calculateEstimatedPoolPrize } from 'lib/services/calculateEstimatedPoolPrize'
import { getGraphLootBoxData } from 'lib/fetchers/getGraphLootBoxData'
import { stringWithPrecision } from 'lib/utils/stringWithPrecision'
import { secondsSinceEpoch } from 'lib/utils/secondsSinceEpoch'
import { getPoolGraphData } from 'lib/fetchers/getPoolGraphData'
import { getPoolChainData } from 'lib/fetchers/getPoolChainData'

const MAINNET_USD_AMOUNT = 0
const TESTNET_USD_AMOUNT = 1
const TESTNET_CHAIN_IDS = [3, 4, 5, 42, 80001]

const bn = ethers.BigNumber.from

const getPool = (graphPool) => {
  const poolAddressKey = Object.keys(graphPool)[0]
  return graphPool[poolAddressKey]
}

/**
 *
 * @param {*} chainId
 * @param {*} readProvider
 * @param {*} poolContracts
 * @returns
 */
export const getPools = async (chainId, poolContracts, fetch) => {
  const poolGraphData = await getPoolGraphData(chainId, poolContracts, fetch)
  const poolChainData = await getPoolChainData(chainId, poolGraphData, fetch)
  let pools = combinePoolData(poolGraphData, poolChainData)
  const lootBoxTokenIds = [...new Set(pools.map((pool) => pool.prize.lootBox?.id).filter(Boolean))]
  const lootBoxData = await getGraphLootBoxData(chainId, lootBoxTokenIds, fetch)
  pools = combineLootBoxData(pools, lootBoxData)
  const erc20Addresses = getAllErc20Addresses(pools)
  const tokenPriceGraphData = await getTokenPriceData(chainId, erc20Addresses, fetch)

  const defaultTokenPriceUsd = TESTNET_CHAIN_IDS.includes(chainId)
    ? TESTNET_USD_AMOUNT
    : MAINNET_USD_AMOUNT
  pools = combineTokenPricesData(pools, tokenPriceGraphData, defaultTokenPriceUsd)
  pools = calculateTotalPrizeValuePerPool(pools)
  pools = calculateTotalValueLockedPerPool(pools)
  pools = calculateTokenFaucetApr(pools)
  pools = addPoolMetadata(pools, poolContracts)

  return pools
}

/**
 * Merges poolGraphData & poolChainData
 * poolGraphData & poolChainData are pre-formatted
 * @param {*} poolGraphData
 * @param {*} poolChainData
 * @returns
 */
const combinePoolData = (poolGraphData, poolChainData) => {
  let pool
  const pools = poolGraphData.map((graphPool) => {
    pool = getPool(graphPool)
    const chainData = poolChainData[pool.prizePool.address]
    return merge(pool, chainData)
  })
  return pools
}

/**
 * Adds loot box data to each pool
 * @param {*} _pools
 * @param {*} lootBoxData
 * @returns
 */
const combineLootBoxData = (_pools, lootBoxData) => {
  const pools = cloneDeep(_pools)
  pools.forEach((pool) => combineLootBoxDataWithPool(pool, lootBoxData))
  return pools
}

/**
 * Adds loot box data to a single pool
 * @param {*} pool
 * @param {*} lootBoxData
 * @returns
 */
export const combineLootBoxDataWithPool = (pool, lootBoxData) => {
  if (lootBoxData.lootBoxes?.length > 0) {
    if (!pool.prize.lootBox) return
    const lootBoxGraphData = lootBoxData.lootBoxes.find(
      (lootBox) => lootBox.tokenId === pool.prize.lootBox.id
    )
    if (!lootBoxGraphData) return
    const formattedLootBox = formatLootBox(lootBoxGraphData)
    pool.prize.lootBox = {
      ...pool.prize.lootBox,
      ...formattedLootBox
    }
  }
}

/**
 * Formats the data returned from the graph for a lootBox
 * @param {*} lootBoxGraphData
 * @returns
 */
export const formatLootBox = (lootBoxGraphData) => ({
  erc1155Tokens: lootBoxGraphData.erc1155Balances,
  erc721Tokens: lootBoxGraphData.erc721Tokens,
  erc20Tokens: lootBoxGraphData.erc20Balances
    .filter((erc20) => !ERC20_BLOCK_LIST.includes(erc20.id))
    .map((erc20) => ({
      ...erc20.erc20Entity,
      address: erc20.erc20Entity.id,
      lootBoxAddress: erc20.erc20Entity.id,
      amountUnformatted: bn(erc20.balance),
      amount: formatUnits(erc20.balance, erc20.erc20Entity.decimals)
    }))
})

/**
 * Gets all erc20 addresses related to a pool
 * @param {*} pools
 * @returns Array of addresses
 */
const getAllErc20Addresses = (pools) => {
  const addresses = new Set()
  pools.forEach((pool) => {
    // Get external erc20s
    pool.prize.externalErc20Awards.forEach((erc20) => addresses.add(erc20.address))
    // Get lootbox erc20s
    pool.prize.lootBox?.erc20Tokens?.forEach((erc20) => addresses.add(erc20.address))
    // Get known tokens
    Object.values(pool.tokens).forEach((erc20) => addresses.add(erc20.address))
  })
  return [...addresses]
}

/**
 * Adds token price data to pools
 * @param {*} _pools
 * @param {*} tokenPriceData
 */
const combineTokenPricesData = (_pools, tokenPriceData, defaultTokenPriceUsd) => {
  const pools = cloneDeep(_pools)

  pools.forEach((pool) => {
    // Add to all known tokens
    Object.values(pool.tokens).forEach((token) =>
      addTokenTotalUsdValue(token, tokenPriceData, defaultTokenPriceUsd)
    )
    // Add to all external erc20 tokens
    Object.values(pool.prize.externalErc20Awards).forEach((token) =>
      addTokenTotalUsdValue(token, tokenPriceData, defaultTokenPriceUsd)
    )
    // Add to all lootBox tokens
    pool.prize.lootBox?.erc20Tokens?.forEach((token) =>
      addTokenTotalUsdValue(token, tokenPriceData, defaultTokenPriceUsd)
    )
    // Add total values for controlled tokens
    const underlyingToken = pool.tokens.underlyingToken
    addTotalValueForControlledTokens(pool.tokens.ticket, underlyingToken)
    addTotalValueForControlledTokens(pool.tokens.sponsorship, underlyingToken)
    // Add total values for reserves
    addTotalValueForReserve(pool)
  })

  return pools
}

/**
 * Adds token USD value if we have the USD price per token
 * @param {*} token
 */
export const addTokenTotalUsdValue = (token, tokenPriceData, defaultTokenPriceUsd) => {
  const priceData = tokenPriceData[token.address]
  if (priceData) {
    token.usd = tokenPriceData[token.address].usd || defaultTokenPriceUsd
    token.derivedETH = tokenPriceData[token.address].derivedETH || defaultTokenPriceUsd.toString()
    if (token.amountUnformatted) {
      const usdValueUnformatted = amountMultByUsd(token.amountUnformatted, token.usd)
      token.totalValueUsd = formatUnits(usdValueUnformatted, token.decimals)
      token.totalValueUsdScaled = toScaledUsdBigNumber(token.totalValueUsd)
    }
  } else {
    token.usd = defaultTokenPriceUsd
    token.derivedETH = defaultTokenPriceUsd.toString()
  }
}

/**
 * Mutates reserve to have the total values
 * @param {*} pool
 */
const addTotalValueForReserve = (pool) => {
  const underlyingToken = pool.tokens.underlyingToken
  const amountUnformatted = pool.reserve.amountUnformatted
  if (amountUnformatted) {
    const totalValueUsdUnformatted = amountMultByUsd(amountUnformatted, underlyingToken.usd)
    pool.reserve.totalValueUsd = formatUnits(totalValueUsdUnformatted, underlyingToken.decimals)
    pool.reserve.totalValueUsdScaled = toScaledUsdBigNumber(pool.reserve.totalValueUsd)
  }
}

/**
 * Need to mult & div by 100 since BigNumber doesn't support decimals
 * @param {*} amount as a BigNumber
 * @param {*} usd as a Number
 * @returns a BigNumber
 */
const amountMultByUsd = (amount, usd) => amount.mul(Math.round(usd * 100)).div(100)

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
const calculateTotalPrizeValuePerPool = (pools) => {
  return pools.map((_pool) => {
    let pool = cloneDeep(_pool)
    // Calculate erc20 values
    pool = calculateExternalErc20TotalValuesUsd(pool)

    // Calculate lootBox award value
    pool = calculateLootBoxTotalValuesUsd(pool)

    // Calculate yield prize
    pool = calculateYieldTotalValuesUsd(pool)

    // Calculate sablier prize
    pool = calculateSablierTotalValueUsd(pool)

    // Calculate total
    pool.prize.totalExternalAwardsValueUsdScaled = addBigNumbers([
      pool.prize.lootBox.totalValueUsdScaled,
      pool.prize.erc20Awards.totalValueUsdScaled
    ])
    pool.prize.totalExternalAwardsValueUsd = formatUnits(
      pool.prize.totalExternalAwardsValueUsdScaled,
      2
    )

    pool.prize.totalInternalAwardsUsdScaled = addBigNumbers([
      pool.prize.yield.totalValueUsdScaled,
      pool.prize.sablierStream.totalValueUsdScaled
    ])
    pool.prize.totalInternalAwardsUsd = formatUnits(pool.prize.totalInternalAwardsUsdScaled, 2)

    pool.prize.totalValueUsdScaled = addBigNumbers([
      pool.prize.totalInternalAwardsUsdScaled,
      pool.prize.totalExternalAwardsValueUsdScaled
    ])
    pool.prize.totalValueUsd = formatUnits(pool.prize.totalValueUsdScaled, 2)

    if (pool.config.splitExternalErc20Awards) {
      const total = pool.prize.totalValueUsdScaled
      calculatePerWinnerPrizes(pool, total)
    } else {
      const total = pool.prize.totalInternalAwardsUsdScaled
      calculatePerWinnerPrizes(pool, total)
    }
    return pool
  })
}

/**
 * Calculates the prize for each winner (grand prize & runner up(s))
 * @param {*} pool
 * @param {*} totalToBeSplit
 */
const calculatePerWinnerPrizes = (pool, totalToBeSplit) => {
  pool.prize.totalValuePerWinnerUsdScaled = totalToBeSplit.div(pool.config.numberOfWinners)
  pool.prize.totalValuePerWinnerUsd = formatUnits(pool.prize.totalValuePerWinnerUsdScaled, 2)
  pool.prize.totalValueGrandPrizeWinnerUsdScaled = addBigNumbers([
    pool.prize.totalValuePerWinnerUsdScaled,
    pool.prize.lootBox.totalValueUsdScaled,
    pool.prize.erc20Awards.totalValueUsdScaled
  ])
  pool.prize.totalValueGrandPrizeWinnerUsd = formatUnits(
    pool.prize.totalValueGrandPrizeWinnerUsdScaled,
    2
  )
}

/**
 * Calculates the total values for all external erc20 tokens
 * @param {*} _pool
 * @returns
 */
const calculateExternalErc20TotalValuesUsd = (_pool) => {
  const pool = cloneDeep(_pool)
  const externalErc20TotalValueUsdScaled = Object.values(pool.prize.externalErc20Awards).reduce(
    addScaledTokenValueToTotal,
    ethers.constants.Zero
  )
  pool.prize.erc20Awards = {
    totalValueUsdScaled: externalErc20TotalValueUsdScaled,
    totalValueUsd: formatUnits(externalErc20TotalValueUsdScaled, 2)
  }
  return pool
}

/**
 * Mutates the token (ticket or sponsorship) to have total USD values
 * @param {*} token
 * @param {*} underlyingToken
 */
const addTotalValueForControlledTokens = (token, underlyingToken) => {
  if (token.totalSupplyUnformatted) {
    const totalValueUsdUnformatted = amountMultByUsd(
      token.totalSupplyUnformatted,
      underlyingToken.usd
    )
    token.usd = underlyingToken.usd
    token.derivedETH = underlyingToken.derivedETH
    token.totalValueUsd = formatUnits(totalValueUsdUnformatted, token.decimals)
    token.totalValueUsdScaled = toScaledUsdBigNumber(token.totalValueUsd)
  }
}

/**
 * Calculates the total value of all erc20 tokens in the loot box
 * @param {*} _pool
 * @returns
 */
const calculateLootBoxTotalValuesUsd = (_pool) => {
  const pool = cloneDeep(_pool)

  const lootBoxTotalValueUsdScaled =
    pool.prize.lootBox?.erc20Tokens?.reduce(addScaledTokenValueToTotal, ethers.constants.Zero) ||
    ethers.constants.Zero

  if (!pool.prize.lootBox) {
    pool.prize.lootBox = { id: null }
  }
  pool.prize.lootBox.totalValueUsdScaled = lootBoxTotalValueUsdScaled
  pool.prize.lootBox.totalValueUsd = formatUnits(lootBoxTotalValueUsdScaled, 2)

  return pool
}

/**
 * Calculates the total yield values, $0 if no yield or no token prices
 * @param {*} _pool
 * @returns
 */
const calculateYieldTotalValuesUsd = (_pool) => {
  const pool = cloneDeep(_pool)
  const yieldAmount = stringWithPrecision(
    calculateEstimatedPoolPrize({
      ticketSupply: pool.tokens.ticket.totalSupplyUnformatted,
      totalSponsorship: pool.tokens.sponsorship.totalSupplyUnformatted,
      awardBalance: pool.prize.amountUnformatted,
      underlyingCollateralDecimals: pool.tokens.underlyingToken.decimals,
      supplyRatePerBlock: pool.tokens.cToken?.supplyRatePerBlock,
      prizePeriodRemainingSeconds: pool.prize.prizePeriodRemainingSeconds
    }),
    { precision: pool.tokens.underlyingToken.decimals - 1 }
  )
  pool.prize.yield = {
    amount: yieldAmount
  }
  pool.prize.yield.amountUnformatted = parseUnits(
    pool.prize.yield.amount,
    pool.tokens.underlyingToken.decimals
  )
  const yieldTotalValueUnformatted = amountMultByUsd(
    pool.prize.yield.amountUnformatted,
    pool.tokens.underlyingToken.usd
  )
  pool.prize.yield.totalValueUsd = formatUnits(
    yieldTotalValueUnformatted,
    pool.tokens.underlyingToken.decimals
  )
  pool.prize.yield.totalValueUsdScaled = toScaledUsdBigNumber(pool.prize.yield.totalValueUsd)

  return pool
}

/**
 * Calculates the total values for the Sablier stream if there is one
 * Otherwise returns values as $0
 * @param {*} _pool
 * @returns
 */
const calculateSablierTotalValueUsd = (_pool) => {
  const pool = cloneDeep(_pool)
  if (!pool.prize.sablierStream?.id) {
    pool.prize.sablierStream = {
      ...pool.prize.sablierStream,
      totalValueUsd: ethers.constants.Zero,
      totalValueUsdScaled: ethers.constants.Zero
    }
    return pool
  }

  const { startTime, stopTime, ratePerSecond } = pool.prize.sablierStream
  const { prizePeriodStartedAt, prizePeriodSeconds, isRngRequested } = pool.prize

  const prizePeriodEndsAt = prizePeriodStartedAt.add(prizePeriodSeconds)
  const currentTime = ethers.BigNumber.from(secondsSinceEpoch())

  // Stream hasn't started yet
  if (prizePeriodEndsAt.lt(startTime)) {
    pool.prize.sablierStream = {
      ...pool.prize.sablierStream,
      totalValueUsd: ethers.constants.Zero,
      totalValueUsdScaled: ethers.constants.Zero
    }
    return pool
  }

  const streamEndsAfterPrizePeriod = stopTime.gt(prizePeriodEndsAt)
  const prizePeriodFinished = currentTime.gt(prizePeriodEndsAt)
  const streamStartedAfterPrizePool = startTime.gte(prizePeriodStartedAt)

  let dripEnd
  // If people take too long to award the prize, the stream will be added to that earlier prize
  if (streamEndsAfterPrizePeriod && prizePeriodFinished && !isRngRequested) {
    const streamHasEnded = stopTime.lte(currentTime)
    dripEnd = streamHasEnded ? stopTime : currentTime
  } else {
    const streamHasEnded = stopTime.lte(prizePeriodEndsAt)
    dripEnd = streamHasEnded ? stopTime : prizePeriodEndsAt
  }
  const dripStart = streamStartedAfterPrizePool ? startTime : prizePeriodStartedAt
  const dripTime = dripEnd.sub(dripStart)

  const amountThisPrizePeriodUnformatted = dripTime.mul(ratePerSecond)
  const amountThisPrizePeriod = formatUnits(
    amountThisPrizePeriodUnformatted,
    pool.tokens.sablierStreamToken.decimals
  )
  const amountPerPrizePeriodUnformatted = prizePeriodSeconds.mul(ratePerSecond)
  const amountPerPrizePeriod = formatUnits(
    amountPerPrizePeriodUnformatted,
    pool.tokens.sablierStreamToken.decimals
  )

  const totalValueUsdUnformatted = amountMultByUsd(
    amountThisPrizePeriodUnformatted,
    pool.tokens.sablierStreamToken.usd
  )
  const totalValueUsd = formatUnits(
    totalValueUsdUnformatted,
    pool.tokens.sablierStreamToken.decimals
  )
  const totalValueUsdScaled = toScaledUsdBigNumber(totalValueUsd)

  pool.prize.sablierStream = {
    ...pool.prize.sablierStream,
    amountUnformatted: pool.prize.sablierStream.deposit,
    amount: formatUnits(pool.prize.sablierStream.deposit, pool.tokens.sablierStreamToken.decimals),
    amountThisPrizePeriodUnformatted,
    amountThisPrizePeriod,
    amountPerPrizePeriodUnformatted,
    amountPerPrizePeriod,
    totalValueUsd,
    totalValueUsdScaled
  }

  return pool
}

/**
 * Adds a list of BigNumbers
 * @param {*} totals an array of scaled BigNumbers, specifically USD values
 * @returns
 */
const addBigNumbers = (totals) =>
  totals.reduce((total, usdScaled) => {
    return usdScaled.add(total)
  }, ethers.constants.Zero)

/**
 * Scaled math that adds the USD value of a token if it is available
 * Math is done scaled up to keep the value of the cents when using BigNumbers
 * @param {*} total
 * @param {*} token
 * @returns
 */
const addScaledTokenValueToTotal = (total, token) => {
  if (token.totalValueUsdScaled) {
    return total.add(token.totalValueUsdScaled)
  }
  return total
}

/**
 * Converts a USD string to a scaled up big number to account for cents
 * @param {*} usdValue a String ex. "100.23"
 * @returns a BigNumber ex. 10023
 */
const toScaledUsdBigNumber = (usdValue) =>
  parseUnits(stringWithPrecision(usdValue, { precision: 2 }), 2)

/**
 * Calculates & adds the tvl of each pool to pools
 * Calculates the tvl of all pools
 * @param {*} pools
 * @returns tvl of all pools
 */
const calculateTotalValueLockedPerPool = (pools) =>
  pools.map((_pool) => {
    const pool = cloneDeep(_pool)
    if (pool.tokens.underlyingToken.usd && pool.tokens.ticket.totalSupplyUnformatted) {
      const totalAmountDepositedUnformatted = pool.tokens.ticket.totalSupplyUnformatted.add(
        pool.tokens.sponsorship.totalSupplyUnformatted
      )

      const totalValueLockedUsdUnformatted = amountMultByUsd(
        totalAmountDepositedUnformatted,
        pool.tokens.underlyingToken.usd
      )
      const tvlTicketsUsdUnformatted = amountMultByUsd(
        pool.tokens.ticket.totalSupplyUnformatted,
        pool.tokens.underlyingToken.usd
      )
      const tvlSponsorshipUsdUnformatted = amountMultByUsd(
        pool.tokens.sponsorship.totalSupplyUnformatted,
        pool.tokens.underlyingToken.usd
      )

      pool.prizePool.totalValueLockedUsd = formatUnits(
        totalValueLockedUsdUnformatted,
        pool.tokens.ticket.decimals
      )
      pool.prizePool.totalValueLockedUsdScaled = toScaledUsdBigNumber(
        pool.prizePool.totalValueLockedUsd
      )
      pool.prizePool.totalTicketValueLockedUsd = formatUnits(
        tvlTicketsUsdUnformatted,
        pool.tokens.ticket.decimals
      )
      pool.prizePool.totalTicketValueLockedUsdScaled = toScaledUsdBigNumber(
        pool.prizePool.totalTicketValueLockedUsd
      )
      pool.prizePool.totalSponsorshipValueLockedUsd = formatUnits(
        tvlSponsorshipUsdUnformatted,
        pool.tokens.ticket.decimals
      )
      pool.prizePool.totalSponsorshipValueLockedUsdScaled = toScaledUsdBigNumber(
        pool.prizePool.totalSponsorshipValueLockedUsd
      )
    } else {
      pool.prizePool.totalValueLockedUsd = '0'
      pool.prizePool.totalValueLockedUsdScaled = ethers.constants.Zero
    }
    return pool
  })

/**
 *
 * @param {*} pools
 * @returns
 */
const calculateTokenFaucetApr = (pools) =>
  pools.map((_pool) => {
    const pool = cloneDeep(_pool)
    if (pool.tokens.tokenFaucetDripToken?.usd) {
      const { amountUnformatted, usd } = pool.tokens.tokenFaucetDripToken
      if (amountUnformatted === ethers.constants.Zero) {
      } else {
        const { dripRatePerSecond } = pool.tokenListener
        const totalDripPerDay = Number(dripRatePerSecond) * SECONDS_PER_DAY
        const totalDripDailyValue = totalDripPerDay * usd
        const totalTicketValueUsd = Number(pool.prizePool.totalTicketValueLockedUsd)
        pool.tokenListener.apr = (totalDripDailyValue / totalTicketValueUsd) * 365 * 100
      }
    }
    return pool
  })

/**
 * Adds contract metadata to the pools
 * @param {*} _pools
 * @param {*} poolContracts
 */
const addPoolMetadata = (_pools, poolContracts) => {
  const pools = cloneDeep(_pools)
  poolContracts.forEach((contract) => {
    const pool = pools.find((pool) => pool.prizePool.address === contract.prizePool.address)
    if (!pool) return
    pool.name = `${pool.tokens.underlyingToken.symbol} Pool`
    pool.contract = contract
    pool.symbol = contract.symbol
  })
  return pools
}
