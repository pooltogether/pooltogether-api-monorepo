import { ContractList } from '@pooltogether/contract-list-schema'
import { contract } from '@pooltogether/etherplex'
import { testnet, mainnet } from '@pooltogether/v4-pool-data'
import { PrizeApi } from '@pooltogether/v4-client-js'
import { batch } from '../batch'
import { log } from '../../../../utils/sentry'
import { DrawResults } from '@pooltogether/draw-calculator-js'

type PrizeFilter = {
  chainId: number
  prizeDistributorAddresses: string[]
}

export const aggregateComputedUsersPrizes = async (event: FetchEvent) => {
  const request = event.request
  const url = new URL(request.url)
  // const _filter = url.searchParams.get('filter')
  const isTestnets = url.searchParams.has('testnets')
  console.log('isTestnets', isTestnets)
  // const filter: PrizeFilter = _filter ? JSON.parse(_filter) : getDefaultFilter(isTestnets)
  const filter = getDefaultFilter(isTestnets)
  const pathname = url.pathname
  const splitPathname = pathname.split('/')
  const usersAddress = splitPathname[2]

  return _aggregateComputedUsersPrizes(event, isTestnets, usersAddress, filter)
}

const _aggregateComputedUsersPrizes = async (
  event: FetchEvent,
  isTestnets: boolean,
  usersAddress: string,
  filters: PrizeFilter[]
) => {
  const results = await Promise.allSettled(
    filters.map((filter) =>
      getUsersDrawResults(
        event,
        isTestnets,
        usersAddress,
        filter.chainId,
        filter.prizeDistributorAddresses
      )
    )
  )
  return results
}

const getUsersDrawResults = async (
  event: FetchEvent,
  isTestnets: boolean,
  usersAddress: string,
  chainId: number,
  prizeDistributorAddresses: string[]
) => {
  const drawIds = await getValidDrawIds(event, isTestnets, chainId)
  const drawsToCheck = prizeDistributorAddresses.flatMap((prizeDistributorAddress) => {
    return drawIds.map((drawId) => {
      return { prizeDistributorAddress, drawId }
    })
  })
  const statusResults = await Promise.allSettled(
    drawsToCheck.map((d) => checkDrawStatus(event, chainId, d.prizeDistributorAddress, d.drawId))
  )

  const availableDrawsToCheck = statusResults
    .filter((r) => r.status === 'fulfilled' && r.value.isValid)
    .map((r) => r.status === 'fulfilled' && r.value)

  const drawResults = await Promise.allSettled(
    availableDrawsToCheck.map((d) =>
      getUsersDrawResultsFromPrizeApi(
        event,
        usersAddress,
        chainId,
        d.prizeDistributorAddress,
        d.drawId
      )
    )
  )

  return drawResults

  // const promises = prizeDistributorAddresses.map(async (prizeDistributorAddress) => {
  //   return drawIds.map((drawId) => {
  //     return getUsersDrawResultsFromPrizeApi(
  //       event,
  //       usersAddress,
  //       chainId,
  //       prizeDistributorAddress,
  //       drawId
  //     )
  //   })
  // })
}

const getUsersDrawResultsFromPrizeApi = async (
  event: FetchEvent,
  usersAddress: string,
  chainId: number,
  prizeDistributorAddress: string,
  drawId: number
) => {
  try {
    return await PrizeApi.getDrawResultsFromPrizeApi(
      chainId,
      usersAddress,
      prizeDistributorAddress,
      drawId,
      1
    )
  } catch (e) {}
}

const checkDrawStatus = async (
  event: FetchEvent,
  chainId: number,
  prizeDistributorAddress: string,
  drawId: number
) => {
  try {
    const isValid = await PrizeApi.checkPrizeApiStatus(chainId, prizeDistributorAddress, drawId)
    return {
      chainId,
      prizeDistributorAddress,
      drawId,
      isValid
    }
  } catch (e) {
    console.log('ERROR', e, e.message, chainId, prizeDistributorAddress, drawId)
    log(e, event)
    return {
      chainId,
      prizeDistributorAddress,
      drawId,
      isValid: false
    }
  }
}

/**
 * Builds a filter filled with the contract data in the contract list from v4-pool-data
 * @param isTestnets
 * @returns
 */
const getDefaultFilter = (isTestnets: boolean) => {
  const contractList: ContractList = isTestnets ? testnet : mainnet
  const chainIds = Array.from(new Set(contractList.contracts.map((c) => c.chainId)))
  const prizeDistributorContracts = contractList.contracts.filter(
    (c) => c.type === 'PrizeDistributor'
  )
  return chainIds.map((chainId) => ({
    chainId,
    prizeDistributorAddresses: prizeDistributorContracts
      .filter((c) => c.chainId === chainId)
      .map((c) => c.address)
  }))
}

/**
 * Assumes all relevant buffers are provided in the contract list from v4-pool-data
 * Assumes only one prize dist buffer & only one draw buffer per chain
 */
const getValidDrawIds = async (event: FetchEvent, isTestnets: boolean, chainId: number) => {
  const contractList: ContractList = isTestnets ? testnet : mainnet
  const prizeDistributionBufferContract = contractList.contracts.find(
    (c) => c.chainId === chainId && c.type === 'PrizeDistributionBuffer'
  )
  const drawBufferContract = contractList.contracts.find(
    (c) => c.chainId === chainId && c.type === 'DrawBuffer'
  )

  const prizeDistributionBuffer = contract(
    prizeDistributionBufferContract.address,
    prizeDistributionBufferContract.abi,
    prizeDistributionBufferContract.address
  )
  const drawBuffer = contract(
    drawBufferContract.address,
    drawBufferContract.abi,
    drawBufferContract.address
  )

  const batchCalls = [
    prizeDistributionBuffer.getOldestPrizeDistribution(),
    prizeDistributionBuffer.getNewestPrizeDistribution(),
    drawBuffer.getOldestDraw(),
    drawBuffer.getNewestDraw()
  ]
  try {
    const response = await batch(chainId, ...batchCalls)
    const oldestPrizeDistribution: { drawId: number } =
      response[prizeDistributionBufferContract.address].getOldestPrizeDistribution
    const newestPrizeDistribution: { drawId: number } =
      response[prizeDistributionBufferContract.address].getNewestPrizeDistribution
    const oldestDraw: { drawId: number } = response[drawBufferContract.address].getOldestDraw[0]
    const newestDraw: { drawId: number } = response[drawBufferContract.address].getNewestDraw[0]
    const oldestValidId = Math.max(oldestPrizeDistribution.drawId, oldestDraw.drawId)
    const newestValidId = Math.min(newestPrizeDistribution.drawId, newestDraw.drawId)
    console.log('draw ids', chainId, oldestValidId, newestValidId)
    if (newestValidId < oldestValidId) return []
    const validIds: number[] = []
    for (let i = oldestValidId; i <= newestValidId; i++) {
      validIds.push(i)
    }
    return validIds
  } catch (e) {
    console.log(
      'ERROR',
      e,
      e.message,
      chainId,
      'pd',
      prizeDistributionBufferContract.address,
      'db',
      drawBufferContract.address
    )
    log(e, event)
    return []
  }
}
