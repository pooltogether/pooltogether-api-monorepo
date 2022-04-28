import { contract } from '@pooltogether/etherplex'
import { log } from '../../../../utils/sentry'

import { batch } from '../batch'
import { getV4PrizePoolsKey } from '../../../../utils/kvKeys'
import { updateHandler } from '../updateHandler'
import { NETWORK } from '../../../../constants/chains'
import { ContractType } from '../../../../constants/contractType'
import { ContractMetadata } from '../interfaces'

const PRIZE_POOLS: { [chainId: number]: ContractMetadata[] } = Object.freeze({
  [NETWORK.mainnet]: [
    {
      address: '0xd89a09084555a7D0ABe7B111b1f78DFEdDd638Be',
      type: ContractType.YieldSourcePrizePool,
      version: '1.0.0',
    },
  ],
  [NETWORK.polygon]: [
    {
      address: '0x19DE635fb3678D8B8154E37d8C9Cdf182Fe84E60',
      type: ContractType.YieldSourcePrizePool,
      version: '1.0.0',
    },
  ],
  [NETWORK.avalanche]: [
    {
      address: '0xF830F5Cb2422d555EC34178E27094a816c8F95EC',
      type: ContractType.YieldSourcePrizePool,
      version: '1.0.0',
    },
  ],
})

export const PRIZE_POOL_SUPPORTED_CHAIN_IDS =
  Object.keys(PRIZE_POOLS).map(Number)

interface PrizePoolAddresses {
  metadata: ContractMetadata
  prizePool: string
  token: string
  ticket: string
  prizeStrategy: string
  yieldSource: string
}

/**
 * Fetches related contract addresses for individual prize pools and updates the KV.
 * @param {*} event
 * @param {*} chainId The chain id to refresh prize pools on
 * @returns
 */
export const updatePrizePools = async (
  event: ScheduledEvent | FetchEvent,
  chainId: number,
) => {
  const rootContractMetadatas = PRIZE_POOLS[chainId]
  return updateHandler<PrizePoolAddresses>(
    event,
    chainId,
    rootContractMetadatas,
    getV4PrizePoolsKey,
    getPrizePoolRelatedContractAddresses,
  )
}

/**
 * Fetches related contract addresses for individual pods
 * @param chainId
 * @param podAddress
 * @returns
 */
const getPrizePoolRelatedContractAddresses = async (
  event: FetchEvent | ScheduledEvent,
  chainId: number,
  rootContractMetadata: ContractMetadata,
) => {
  const prizePoolContract = contract(
    rootContractMetadata.address,
    MinimalPrizePoolAbi,
    rootContractMetadata.address,
  )
  let batchCalls = []

  batchCalls.push(
    prizePoolContract.getToken().getTicket().getPrizeStrategy().yieldSource(),
  )

  let response = await batch(chainId, ...batchCalls)
  batchCalls = []

  const relatedAddresses: PrizePoolAddresses = {
    metadata: rootContractMetadata,
    prizePool: rootContractMetadata.address,
    token: response[rootContractMetadata.address].getToken[0],
    ticket: response[rootContractMetadata.address].getTicket[0],
    prizeStrategy: response[rootContractMetadata.address].getPrizeStrategy[0],
    yieldSource: response[rootContractMetadata.address].yieldSource[0],
  }

  return relatedAddresses
}

const MinimalPrizePoolAbi = [
  {
    inputs: [],
    name: 'getTicket',
    outputs: [
      {
        internalType: 'contract ITicket',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getToken',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPrizeStrategy',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'yieldSource',
    outputs: [
      {
        internalType: 'contract IYieldSource',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
