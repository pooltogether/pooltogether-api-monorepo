import { contract } from '@pooltogether/etherplex'
import { calculateCreamBorrowApy, calculateCreamSupplyApy } from '@pooltogether/utilities'

import { CREAM_CR_TOKEN_ADDRESSES } from '../../utils/constants'
import { batch } from './cloudflare-workers-batch'
import { CrTokenAbi } from '../../abis/CrTokenAbi'
import { CrInterestRateModalAbi } from './abis/CrInterestRateModel'

// Add to this list to begin capturing apy data for cream markets
const TOKEN_ADDRESSES = Object.freeze({
  // Mainnet
  1: [CREAM_CR_TOKEN_ADDRESSES[1].crUSDC],
  // BSC
  56: [
    CREAM_CR_TOKEN_ADDRESSES[56].crBUSD,
    CREAM_CR_TOKEN_ADDRESSES[56].crCAKE,
    CREAM_CR_TOKEN_ADDRESSES[56].crWBNB
  ]
})

/**
 *
 * @param {*} event
 */
export const getCream = async (event) => {
  try {
    const chainIds = Object.keys(TOKEN_ADDRESSES)
    const promises = chainIds.map(getCreamInterestRate)
    const results = await Promise.all(promises)

    console.log('results')
    console.log(JSON.stringify(results))

    const interestRatesByChainId = {}
    results.map((result) => {
      const { chainId, interestRates } = result
      interestRatesByChainId[chainId] = interestRates
    })

    return interestRatesByChainId
  } catch (e) {
    event.waitUntil(log(e, event.request))
    return null
  }
}

const getCreamInterestRate = async (chainId) => {
  const crTokenAddresses = TOKEN_ADDRESSES[chainId]

  // Fetch numbers to calculate supply apy from crToken
  const crTokenBatchCalls = []
  crTokenAddresses.map((crTokenAddress) => {
    const crTokenContract = contract(crTokenAddress, CrTokenAbi, crTokenAddress)
    crTokenBatchCalls.push(
      crTokenContract
        .decimals()
        .totalBorrows()
        .totalReserves()
        .getCash()
        .interestRateModel()
        .reserveFactorMantissa()
    )
  })
  const tokenResponses = await batch(chainId, ...crTokenBatchCalls)

  // Fetch numbers to calculate supply apy from interest rate model
  const crInterestRateModelBatchCalls = []
  crTokenAddresses.map((crTokenAddress) => {
    const cash = tokenResponses[crTokenAddress].getCash[0]
    const borrows = tokenResponses[crTokenAddress].totalBorrows[0]
    const reserves = tokenResponses[crTokenAddress].totalReserves[0]
    const interestRateModelAddress = tokenResponses[crTokenAddress].interestRateModel[0]

    const crInterestRateModel = contract(
      crTokenAddress,
      CrInterestRateModalAbi,
      interestRateModelAddress
    )
    crInterestRateModelBatchCalls.push(
      crInterestRateModel
        .baseRatePerBlock()
        .multiplierPerBlock()
        .utilizationRate(cash, borrows, reserves)
        .kink1()
        .kink2()
        .jumpMultiplierPerBlock()
        .blocksPerYear()
    )
  })

  const interestRateResponses = await batch(chainId, ...crInterestRateModelBatchCalls)

  // Calculate borrow & supply apy per crToken
  const interestRates = {}
  crTokenAddresses.map((crTokenAddress) => {
    const reserveFactorUnformatted = tokenResponses[crTokenAddress].reserveFactorMantissa[0]
    const baseUnformatted = interestRateResponses[crTokenAddress].baseRatePerBlock[0]
    const multiplierUnformatted = interestRateResponses[crTokenAddress].multiplierPerBlock[0]
    const utilizationRateUnformatted = interestRateResponses[crTokenAddress].utilizationRate[0]
    const kink1Unformatted = interestRateResponses[crTokenAddress].kink1[0]
    const kink2Unformatted = interestRateResponses[crTokenAddress].kink2[0]
    const jumpMultiplierUnformatted =
      interestRateResponses[crTokenAddress].jumpMultiplierPerBlock[0]
    const blocksPerYearBN = interestRateResponses[crTokenAddress].blocksPerYear[0]

    const borrowApy = calculateCreamBorrowApy(
      baseUnformatted,
      multiplierUnformatted,
      utilizationRateUnformatted,
      kink1Unformatted,
      kink2Unformatted,
      jumpMultiplierUnformatted,
      blocksPerYearBN
    )

    const supplyApy = calculateCreamSupplyApy(
      borrowApy,
      reserveFactorUnformatted,
      utilizationRateUnformatted,
      blocksPerYearBN
    )

    interestRates[crTokenAddress] = {
      borrowApy,
      supplyApy
    }
  })

  return {
    interestRates,
    chainId
  }
}
