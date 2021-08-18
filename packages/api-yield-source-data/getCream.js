import { log } from '../../utils/sentry'
import { contract } from '@pooltogether/etherplex'

import { CREAM_CR_TOKEN_ADDRESSES } from '../../utils/constants'
import { batch } from './cloudflare-workers-batch'
import { CrTokenAbi } from '../../abis/CrTokenAbi'
import { CrInterestRateModalAbi } from '../../abis/CrInterestRateModel'
import { ethers } from 'ethers'

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
    crTokenBatchCalls.push(crTokenContract.supplyRatePerBlock().interestRateModel())
  })
  const tokenResponses = await batch(chainId, ...crTokenBatchCalls)

  // Fetch numbers to calculate supply apy from interest rate model
  const crInterestRateModelBatchCalls = []
  crTokenAddresses.map((crTokenAddress) => {
    const interestRateModelAddress = tokenResponses[crTokenAddress].interestRateModel[0]

    const crInterestRateModel = contract(
      crTokenAddress,
      CrInterestRateModalAbi,
      interestRateModelAddress
    )
    crInterestRateModelBatchCalls.push(crInterestRateModel.blocksPerYear())
  })

  const interestRateResponses = await batch(chainId, ...crInterestRateModelBatchCalls)

  // Calculate borrow & supply apy per crToken
  const interestRates = {}
  crTokenAddresses.map((crTokenAddress) => {
    const supplyRatePerBlock = tokenResponses[crTokenAddress].supplyRatePerBlock[0]
    const blocksPerYearBN = interestRateResponses[crTokenAddress].blocksPerYear[0]

    const supplyApy = ethers.utils.formatUnits(supplyRatePerBlock.mul(blocksPerYearBN), 18)

    interestRates[crTokenAddress] = {
      supplyApy
    }
  })

  return {
    interestRates,
    chainId
  }
}
