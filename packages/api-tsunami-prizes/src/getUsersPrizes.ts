import { testnet, mainnet } from '@pooltogether/v4-pool-data'
import { batch } from './cloudflare-workers-batch'
import { getProviders } from './getProviders'
import {
  calculateDrawResults,
  Draw,
  PrizeDistribution,
  User,
  filterResultsByValue
} from '@pooltogether/draw-calculator-js'
import { BigNumber, ethers } from 'ethers'
import { ContractList, ContractMetadata, PrizeDistributorData, PrizeDistributors } from './types'
import { contract } from '@pooltogether/etherplex'
import { ContractType, getContractsByType } from './contractType'
import { log } from '../../../utils/sentry'

// Validation
const SUPPORTED_NETWORKS = Object.freeze({
  mainnets: [1, 137],
  testnets: [4, 80001]
})
const VALID_NETWORKS = [...SUPPORTED_NETWORKS['mainnets'], ...SUPPORTED_NETWORKS['testnets']]

const prizeDistributors: PrizeDistributors = {}

/**
 *
 * @param _chainId
 * @param prizeDistributorAddress
 * @param usersAddress
 * @param _drawId
 * @returns
 */
export const getUsersPrizes = async (
  _chainId: string,
  prizeDistributorAddress: string,
  usersAddress: string,
  _drawId: string
) => {
  try {
    const chainId = Number(_chainId)
    const drawId = Number(_drawId)

    console.log('====================================')
    console.log(
      'Params: ',
      '_chainId',
      _chainId,
      'prizeDistributorAddress',
      prizeDistributorAddress,
      'usersAddress',
      usersAddress,
      '_drawId',
      _drawId
    )
    console.log('====================================')

    // validateParameters(usersAddress, chainId, prizeDistributorAddress, drawId)

    const contractList = getContractList(chainId)

    const prizeDistributorContractMetadatas = getPrizeDistributorContracts(
      chainId,
      prizeDistributorAddress,
      contractList.contracts
    )

    // Get the users normalized balance for that draw
    const drawCalculatorContractMetadata = getContractsByType(
      prizeDistributorContractMetadatas,
      ContractType.DrawCalculator
    )[0]
    const drawCalculatorContract = contract(
      drawCalculatorContractMetadata.address,
      drawCalculatorContractMetadata.abi,
      drawCalculatorContractMetadata.address
    )
    let response = await batch(
      chainId,
      drawCalculatorContract.getNormalizedBalancesForDrawIds(usersAddress, [drawId])
    )
    const normalizedBalance: BigNumber =
      response[drawCalculatorContractMetadata.address].getNormalizedBalancesForDrawIds[0][0]

    // If they had no balance, short circuit
    if (normalizedBalance.isZero()) {
      return {
        drawId: drawId,
        totalValue: ethers.constants.Zero,
        prizes: []
      }
    }

    // TODO: Will need to properly link the buffer addresses to this prize distribution
    // Fetch the draw and prize distribution
    const drawBufferContractMetadata = getContractsByType(
      prizeDistributorContractMetadatas,
      ContractType.DrawBuffer
    )[0]
    const drawBufferContract = contract(
      drawBufferContractMetadata.address,
      drawBufferContractMetadata.abi,
      drawBufferContractMetadata.address
    )
    const prizeDistributionBufferContractMetadata = getContractsByType(
      prizeDistributorContractMetadatas,
      ContractType.PrizeDistributionBuffer
    )[0]
    const prizeDistributionBufferContract = contract(
      prizeDistributionBufferContractMetadata.address,
      prizeDistributionBufferContractMetadata.abi,
      prizeDistributionBufferContractMetadata.address
    )

    // TODO: Proper error catching when this draw doesn't exist or when the prize distribution hasn't been pushed
    response = await batch(
      chainId,
      drawBufferContract.getDraw(drawId),
      prizeDistributionBufferContract.getPrizeDistribution(drawId)
    )

    const draw: Draw = response[drawBufferContractMetadata.address].getDraw[0]
    const prizeDistribution: PrizeDistribution =
      response[prizeDistributionBufferContractMetadata.address].getPrizeDistribution[0]
    const user: User = {
      address: usersAddress,
      normalizedBalances: [normalizedBalance]
    }

    const drawResults = calculateDrawResults(prizeDistribution, draw, user)

    const filteredDrawResults = filterResultsByValue(drawResults, prizeDistribution.maxPicksPerUser)
    return filteredDrawResults
  } catch (e) {
    log(e.message)
    throw new Error('Error calculating draw results')
  }
}

/**
 * TODO: Check chain id and return testnets or prod
 * @param chainId
 * @returns
 */
const getContractList = (chainId: number): ContractList => {
  return SUPPORTED_NETWORKS.mainnets.includes(chainId) ? mainnet : testnet
}

/**
 * TODO: Make this actually filter data properly.
 * Right now it naively assumes that all contracts on the same chain id are connected but that is NOT the case if there are multiple pools on the same network
 * @param chainId
 * @param prizeDistributorAddress
 * @param contractList
 * @returns
 */
const getPrizeDistributorContracts = (
  chainId: number,
  prizeDistributorAddress: string,
  contractList: ContractMetadata[]
) => contractList.filter((contract) => contract.chainId === chainId)

/**
 *
 * @param chainId
 * @param prizeDistributorAddress
 * @returns
 */
const getPrizeDistributorId = (chainId: number, prizeDistributorAddress: string) =>
  `${chainId}-${prizeDistributorAddress}`

/**
 *
 * @param usersAddress
 * @param chainId
 * @param prizeDistributorAddress
 * @param drawId
 */
const validateParameters = async (
  usersAddress: string,
  chainId: number,
  prizeDistributorAddress: string,
  drawId: number
) => {
  // Check chain id
  if (!VALID_NETWORKS.includes(chainId)) {
    throw new Error(
      `Invalid chain id ${chainId}. Supported chain ids: ${VALID_NETWORKS.join(', ')}`
    )
  } else if (!ethers.utils.isAddress(usersAddress)) {
    throw new Error(`Invalid users address ${usersAddress}.`)
  } else if (!ethers.utils.isAddress(prizeDistributorAddress)) {
    throw new Error(`Invalid users address ${prizeDistributorAddress}.`)
  }
}
