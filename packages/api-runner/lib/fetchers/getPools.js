import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import { ethers } from 'ethers'
import { formatUnits, parseUnits } from '@ethersproject/units'
import { addBigNumbers, toScaledUsdBigNumber, toNonScaledUsdString } from '@pooltogether/utilities'

import {
  CUSTOM_CONTRACT_ADDRESSES,
  NETWORK,
  ERC20_BLOCK_LIST,
  SECONDS_PER_DAY
} from 'lib/constants'
import { getLootBoxGraphData } from 'lib/fetchers/getLootBoxGraphData'
import { getLootBoxChainData } from 'lib/fetchers/getLootBoxChainData'
import { getPoolGraphData } from 'lib/fetchers/getPoolGraphData'
import { getPoolChainData } from 'lib/fetchers/getPoolChainData'
import { getTokenPriceData } from 'lib/fetchers/getTokenPriceData'
import { stringWithPrecision } from 'lib/utils/stringWithPrecision'
import { secondsSinceEpoch } from 'lib/utils/secondsSinceEpoch'
import { getCustomYieldSourceData } from 'lib/fetchers/getCustomYieldSourceData'
import { calculateYieldTotalValuesUsd } from 'lib/utils/calculateYieldTotalValuesUsd'
import { PRIZE_POOL_TYPES, SECONDS_PER_WEEK } from '@pooltogether/current-pool-data'

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
 * @param {*} poolContracts
 * @returns
 */
export const getPools = async (chainId, poolContracts) => {
  try {
    console.log('Acual Pool fetching', chainId, JSON.stringify(poolContracts), typeof poolContracts)
    const poolGraphData = await getPoolGraphData(chainId, poolContracts)
    console.log('poolGraphData', poolGraphData ? JSON.stringify(poolGraphData) : poolGraphData)
    const poolChainData = await getPoolChainData(chainId, poolGraphData)
    console.log('poolChainData', poolChainData ? JSON.stringify(poolChainData) : poolChainData)
    let pools = combinePoolData(poolGraphData, poolChainData)
    pools = await getCustomYieldSourceData(chainId, pools)
    console.log('getCustomYieldSourceData', pools ? JSON.stringify(pools) : pools)
    const lootBoxTokenIds = [
      ...new Set(pools.map((pool) => pool.prize.lootBox?.id).filter(Boolean))
    ]
    const lootBoxGraphData = await getLootBoxGraphData(chainId, lootBoxTokenIds)
    pools = combineLootBoxData(chainId, pools, lootBoxGraphData)
    pools = await getLootBoxChainData(pools, chainId)

    const erc20Addresses = getAllErc20Addresses(pools)
    const tokenPriceGraphData = await getTokenPriceData(chainId, erc20Addresses)
    console.log('tokenPriceGraphData', chainId, erc20Addresses, JSON.stringify(tokenPriceGraphData))

    const defaultTokenPriceUsd = TESTNET_CHAIN_IDS.includes(chainId)
      ? TESTNET_USD_AMOUNT
      : MAINNET_USD_AMOUNT
    pools = combineTokenPricesData(pools, tokenPriceGraphData, defaultTokenPriceUsd)
    pools = await Promise.all(await calculateTotalPrizeValuePerPool(pools))
    pools = calculateTotalValueLockedPerPool(pools)
    pools = calculateWeeklyPrizes(pools)
    pools = calculateTokenFaucetAprs(pools)
    pools = addPoolMetadata(pools, poolContracts)

    return pools
  } catch (e) {
    console.log('ERROR')
    console.log(e.message)
    throw e
  }
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
 * @param {*} chainId
 * @param {*} _pools
 * @param {*} lootBoxGraphData
 * @returns
 */
const combineLootBoxData = (chainId, _pools, lootBoxGraphData) => {
  const pools = cloneDeep(_pools)
  pools.forEach((pool) => combineLootBoxDataWithPool(chainId, pool, lootBoxGraphData))
  return pools
}

/**
 * Adds loot box data to a single pool
 * @param {*} chainId
 * @param {*} pool
 * @param {*} lootBoxGraphData
 * @returns
 */
export const combineLootBoxDataWithPool = (chainId, pool, lootBoxGraphData) => {
  if (lootBoxGraphData.lootBoxes?.length > 0) {
    if (!pool.prize.lootBox) return
    const lootBoxData = lootBoxGraphData.lootBoxes.find(
      (lootBox) => lootBox.tokenId === pool.prize.lootBox.id
    )
    if (!lootBoxData) return
    const formattedLootBox = formatLootBox(chainId, lootBoxData)
    pool.prize.lootBox = {
      ...pool.prize.lootBox,
      ...formattedLootBox
    }
  }
}

/**
 * Formats the data returned from the graph for a lootBox
 * @param {*} chainId
 * @param {*} lootBoxGraphData
 * @returns
 */
export const formatLootBox = (chainId, lootBoxData) => ({
  erc1155Tokens: lootBoxData.erc1155Balances,
  erc721Tokens: lootBoxData.erc721Tokens,
  erc20Tokens: lootBoxData.erc20Balances
    .filter((erc20) => !ERC20_BLOCK_LIST[chainId]?.includes(erc20.erc20Entity.id.toLowerCase()))
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

    // Token faucet drip tokens
    pool.tokenFaucets?.forEach((tokenFaucet) => addresses.add(tokenFaucet.asset))
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
    // Add for token faucet drip tokens
    if (Array.isArray(pool.tokenFaucets)) {
      Object.values(pool.tokenFaucets).forEach((tokenFaucet) => {
        addTokenTotalUsdValue(tokenFaucet.dripToken, tokenPriceData, defaultTokenPriceUsd)
      })
    }

    // Add to all known tokens
    Object.values(pool.tokens).forEach((token) => {
      // This takes care of tokenFaucetDripTokens:
      if (Array.isArray(token)) {
        token.forEach((t) => {
          addTokenTotalUsdValue(t, tokenPriceData, defaultTokenPriceUsd)
        })
        // Regular ticket/sponsorship tokens case:
      } else {
        addTokenTotalUsdValue(token, tokenPriceData, defaultTokenPriceUsd)
      }
    })

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
const calculateTotalPrizeValuePerPool = async (pools) => {
  return pools.map(async (_pool) => {
    let pool = cloneDeep(_pool)
    // Calculate erc20 values
    pool = calculateExternalErc20TotalValuesUsd(pool)

    // Calculate lootBox award value
    pool = calculateLootBoxTotalValuesUsd(pool)

    // Calculate yield prize
    pool = await calculateYieldTotalValuesUsd(pool)

    // Calculate sablier prize
    pool = calculateSablierTotalValueUsd(pool)

    // Calculate total
    pool.prize.totalExternalAwardsValueUsdScaled = addBigNumbers(
      [
        pool.prize.lootBox.totalValueUsdScaled,
        pool.prize.erc20Awards.totalValueUsdScaled,
        pool.prize.yield?.comp?.totalValueUsdScaled
      ].filter(Boolean)
    )

    pool.prize.totalExternalAwardsValueUsd = formatUnits(
      pool.prize.totalExternalAwardsValueUsdScaled,
      2
    )

    pool.prize.totalInternalAwardsUsdScaled = addBigNumbers(
      [
        pool.prize.yield?.totalValueUsdScaled,
        pool.prize.sablierStream.totalValueUsdScaled,
        pool.prize.stake?.totalValueUsdScaled
      ].filter(Boolean)
    )
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
const calculateTokenFaucetAprs = (pools) =>
  pools.map((_pool) => {
    const pool = cloneDeep(_pool)

    pool.tokenFaucets?.forEach((tokenFaucet) => {
      const { address, amountUnformatted } = tokenFaucet.dripToken

      let usd = tokenFaucet.dripToken.usd

      // asset is pPOOL, use POOL price
      if (address.toLowerCase() === CUSTOM_CONTRACT_ADDRESSES[NETWORK.mainnet].PPOOL) {
        usd = pool.tokens.pool.usd
      }

      if (usd && amountUnformatted !== ethers.constants.Zero) {
        const { dripRatePerSecond, measure } = tokenFaucet
        console.log(measure)

        const totalDripPerDay = Number(dripRatePerSecond) * SECONDS_PER_DAY
        const totalDripDailyValue = totalDripPerDay * usd

        const totalTicketValueUsd = Number(pool.prizePool.totalTicketValueLockedUsd)
        const totalSponsorshipValueUsd = Number(pool.prizePool.totalSponsorshipValueLockedUsd)

        const faucetIncentivizesSponsorship =
          measure.toLowerCase() === pool.tokens.sponsorship.address.toLowerCase()

        const totalValueUsd = faucetIncentivizesSponsorship
          ? totalSponsorshipValueUsd
          : totalTicketValueUsd

        tokenFaucet.apr = (totalDripDailyValue / totalValueUsd) * 365 * 100
      }
    })

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

/**
 * Calculate weekly prizes per pool
 * @param {*} _pools
 * @returns
 */
const calculateWeeklyPrizes = (_pools) => {
  return _pools.map(calculateWeeklyPrize)
}

/**
 * Calculates the estimated weekly prize of the provided pool
 * Staking pools: Only one iteration of the pool is counted since
 *    we can't guarantee there's another prize
 * TODO: Prizes that come from Sablier need an extra check to see if
 *    the prize will end within the week timeframe.
 *
 * @param {*} _pool
 * @returns
 */
const calculateWeeklyPrize = (_pool) => {
  const pool = cloneDeep(_pool)

  const prizePeriod = pool.prize.prizePeriodSeconds.toString()
  const secondsPerWeek = SECONDS_PER_WEEK
  const accuracyScaling = 1000000

  const prizePeriodsPerWeek = ethers.BigNumber.from(secondsPerWeek)
    .mul(accuracyScaling)
    .div(prizePeriod)

  let weeklyTotalValueUsdScaled
  if (pool.prizePool.type === PRIZE_POOL_TYPES.stake) {
    weeklyTotalValueUsdScaled = calculateStakePoolWeeklyTotalValueUsdScaled(
      pool.prize.totalValueUsdScaled,
      pool.prize.totalInternalAwardsUsdScaled,
      prizePeriodsPerWeek,
      accuracyScaling
    )
  } else {
    weeklyTotalValueUsdScaled = calculateWeeklyTotalValueUsdScaled(
      pool.prize.totalValueUsdScaled,
      pool.prize.totalInternalAwardsUsdScaled,
      prizePeriodsPerWeek,
      accuracyScaling
    )
  }

  const weeklyTotalValueUsd = toNonScaledUsdString(weeklyTotalValueUsdScaled)

  pool.prize.weeklyTotalValueUsd = weeklyTotalValueUsd
  pool.prize.weeklyTotalValueUsdScaled = weeklyTotalValueUsdScaled

  return pool
}

/**
 * Estimates the weekly prize for stake pools.
 * Only accounts for a maximum of 1 prize per week since we can't guarantee
 * there will be another prize.
 */
const calculateStakePoolWeeklyTotalValueUsdScaled = (
  totalValueUsdScaled,
  internalValueUsdScaled,
  prizePeriodsPerWeek,
  accuracyScaling
) => {
  if (prizePeriodsPerWeek < 1) {
    return calculateWeeklyTotalValueUsdScaled(
      totalValueUsdScaled,
      internalValueUsdScaled,
      prizePeriodsPerWeek,
      accuracyScaling
    )
  } else {
    return totalValueUsdScaled
  }
}

/**
 * Estimate the weekly prize based on the current total prize and the expected
 * internal prize for the next X prizes.
 *
 * prizePeriodsPerWeek * internalValueUsdScaled + (totalValueUsdScaled - internalValueUsdScaled)
 * @param {*} totalValueUsdScaled
 * @param {*} internalValueUsdScaled
 * @param {*} prizePeriodsPerWeek
 * @param {*} accuracyScaling
 * @returns
 */
const calculateWeeklyTotalValueUsdScaled = (
  totalValueUsdScaled,
  internalValueUsdScaled,
  prizePeriodsPerWeek,
  accuracyScaling
) =>
  prizePeriodsPerWeek
    .mul(internalValueUsdScaled)
    .sub(internalValueUsdScaled.mul(accuracyScaling))
    .add(totalValueUsdScaled.mul(accuracyScaling))
    .div(accuracyScaling)
