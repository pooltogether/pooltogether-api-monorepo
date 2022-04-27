import { contract } from '@pooltogether/etherplex'
import { log } from '../../../../utils/sentry'

import { batch } from '../batch'
import { getPrizeDistributorsKey } from '../../../../utils/kvKeys'
import { updateHandler } from '../updateHandler'
import { NETWORK } from '../../../../constants/chains'
import { ContractType } from '../../../../constants/contractType'
import { ContractMetadata } from '../interfaces'

const PRIZE_DISTRIBUTORS: { [chainId: number]: ContractMetadata[] } =
  Object.freeze({
    [NETWORK.mainnet]: [
      {
        address: '0xb9a179DcA5a7bf5f8B9E088437B3A85ebB495eFe',
        type: ContractType.PrizeDistributor,
        version: '1.0.0',
      },
    ],
    [NETWORK.polygon]: [
      {
        address: '0x8141BcFBcEE654c5dE17C4e2B2AF26B67f9B9056',
        type: ContractType.PrizeDistributor,
        version: '1.0.0',
      },
    ],
    [NETWORK.avalanche]: [
      {
        address: '0x83332F908f403ce795D90f677cE3f382FE73f3D1',
        type: ContractType.PrizeDistributor,
        version: '1.0.0',
      },
    ],
  })

export const PRIZE_DISTRIBUTORS_SUPPORTED_CHAIN_IDS =
  Object.keys(PRIZE_DISTRIBUTORS).map(Number)

interface PrizeDistributorAddresses {
  metadata: ContractMetadata
  prizeDistributor: string
  token: string
  drawCalculator: string
  drawCalculatorTimelock?: string
  drawBuffer: string
  prizeDistributionBuffer: string
}

/**
 * Fetches related contract addresses for individual prize distributors and updates the KV.
 * @param {*} event
 * @param {*} chainId The chain id to refresh prize pools on
 * @returns
 */
export const updatePrizeDistributors = async (
  event: ScheduledEvent | FetchEvent,
  chainId: number,
) => {
  const rootContractMetadatas = PRIZE_DISTRIBUTORS[chainId]
  return updateHandler<PrizeDistributorAddresses>(
    event,
    chainId,
    rootContractMetadatas,
    getPrizeDistributorsKey,
    getPrizeDistributorRelatedContractAddresses,
  )
}

/**
 * Fetches related contract addresses for individual pods
 * @param chainId
 * @param podAddress
 * @returns
 */
const getPrizeDistributorRelatedContractAddresses = async (
  event: FetchEvent | ScheduledEvent,
  chainId: number,
  rootContractMetadata: ContractMetadata,
) => {
  const prizeDistributorContract = contract(
    rootContractMetadata.address,
    MinimalPrizeDistributorAbi,
    rootContractMetadata.address,
  )
  let batchCalls = []

  // Fetch potential drawCalculator and token to be distributed
  batchCalls.push(prizeDistributorContract.getToken().getDrawCalculator())

  let response = await batch(chainId, ...batchCalls)
  batchCalls = []

  const relatedAddresses: PrizeDistributorAddresses = {
    metadata: rootContractMetadata,
    prizeDistributor: rootContractMetadata.address,
    token: response[rootContractMetadata.address].getToken[0],
    drawCalculator: null,
    drawCalculatorTimelock: null,
    drawBuffer: null,
    prizeDistributionBuffer: null,
  }

  const addressToCheck =
    response[rootContractMetadata.address].getDrawCalculator[0]

  const potentialDrawCalculatorTimelockContract = contract(
    addressToCheck,
    MinimalDrawCalculatorTimelockAbi,
    addressToCheck,
  )

  // Determine if it's a drawCalculator or a drawCalculatorTimelock
  try {
    response = await batch(
      chainId,
      potentialDrawCalculatorTimelockContract.getDrawCalculator(),
    )
    relatedAddresses.drawCalculator =
      response[addressToCheck].getDrawCalculator[0]
    relatedAddresses.drawCalculatorTimelock = addressToCheck
  } catch (e) {
    relatedAddresses.drawCalculator = addressToCheck
  }

  // Fetch buffers
  try {
    const drawCalculatorContract = contract(
      relatedAddresses.drawCalculator,
      MinimalDrawCalculatorAbi,
      relatedAddresses.drawCalculator,
    )
    batchCalls.push(
      drawCalculatorContract.getDrawBuffer().getPrizeDistributionBuffer(),
    )
    response = await batch(chainId, ...batchCalls)
    relatedAddresses.drawBuffer =
      response[relatedAddresses.drawCalculator].getDrawBuffer[0]
    relatedAddresses.prizeDistributionBuffer =
      response[relatedAddresses.drawCalculator].getPrizeDistributionBuffer[0]
  } catch (e) {
    event.waitUntil(
      log(
        new Error(
          `Error fetching drawBuffer, prizeDistributionBuffer & timelock for ${rootContractMetadata.address}`,
        ),
        (event as FetchEvent)?.request,
      ),
    )
  }

  return relatedAddresses
}

const MinimalPrizeDistributorAbi = [
  {
    inputs: [],
    name: 'getToken',
    outputs: [
      {
        internalType: 'contract IERC20',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDrawCalculator',
    outputs: [
      {
        internalType: 'contract IDrawCalculator',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const MinimalDrawCalculatorTimelockAbi = [
  {
    inputs: [],
    name: 'getDrawCalculator',
    outputs: [
      {
        internalType: 'contract IDrawCalculator',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const MinimalDrawCalculatorAbi = [
  {
    inputs: [],
    name: 'getDrawBuffer',
    outputs: [
      {
        internalType: 'contract IDrawBuffer',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPrizeDistributionBuffer',
    outputs: [
      {
        internalType: 'contract IPrizeDistributionBuffer',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
