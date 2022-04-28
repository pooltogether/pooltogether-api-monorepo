import { contract } from '@pooltogether/etherplex'

import { batch } from '../batch'
import { getV3PrizePoolAddressesKey } from '../../../../utils/kvKeys'
import { updateHandler } from '../updateHandler'
import { NETWORK } from '../../../../constants/chains'
import { ContractMetadata } from '../interfaces'

interface V3PrizePoolContractMetadata extends ContractMetadata {
  tokenFaucets: string[]
}

const V3_PRIZE_POOLS: { [chainId: number]: V3PrizePoolContractMetadata[] } =
  Object.freeze({
    [NETWORK.mainnet]: [
      {
        address: '0xebfb47a7ad0fd6e57323c8a42b2e5a6a4f68fc1a',
        tokenFaucets: ['0xf362ce295f2a4eae4348ffc8cdbce8d729ccb8eb'],
      },
      {
        address: '0x0650d780292142835f6ac58dd8e2a336e87b4393',
        tokenFaucets: ['0xa5dddefd30e234be2ac6fc1a0364cfd337aa0f61'],
      },
      {
        address: '0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416',
        tokenFaucets: ['0xbd537257fad96e977b9e545be583bbf7028f30b9'],
      },
      {
        address: '0x396b4489da692788e327e2e4b2b0459a5ef26791',
        tokenFaucets: ['0x30430419b86e9512e6d93fc2b0791d98dbeb637b'],
      },
      {
        address: '0xbc82221e131c082336cf698f0ca3ebd18afd4ce7',
        tokenFaucets: ['0x72f06a78bbaac0489067a1973b0cef61841d58bc'],
      },
      {
        address: '0xc2a7dfb76e93d12a1bb1fa151b9900158090395d',
        tokenFaucets: ['0x40f76363129118b34cc2af44963192c3e8690ba6'],
      },
      {
        address: '0xc32a0f9dfe2d93e8a60ba0200e033a59aec91559',
        tokenFaucets: [
          '0xddcf915656471b7c44217fb8c51f9888701e759a',
          '0xd186302304fd367488b5087af5b12cb9b7cf7540',
        ],
      },
      {
        address: '0xeab695a8f5a44f583003a8bc97d677880d528248',
        tokenFaucets: [],
      },
      {
        address: '0x3af7072d29adde20fc7e173a7cb9e45307d2fb0a',
        tokenFaucets: ['0x9a29401ef1856b669f55ae5b24505b3b6faeb370'],
      },
      {
        address: '0x65c8827229fbd63f9de9fdfd400c9d264066a336',
        tokenFaucets: [],
      },
    ],
    [NETWORK.polygon]: [
      {
        address: '0x887e17d791dcb44bfdda3023d26f7a04ca9c7ef4',
        tokenFaucets: [
          '0x90a8d8ee6fdb1875028c6537877e6704b2646c51',
          '0x951A969324127Fcc19D3498d6954A296E3B9C33c',
          '0x12533c9fe479ab8c27e55c1b7697e0647fadb153',
        ],
      },
      {
        address: '0xee06abe9e2af61cabcb13170e01266af2defa946',
        tokenFaucets: ['0x6cbc003fe015d753180f072d904ba841b2415498'],
      },
    ],
    [NETWORK.celo]: [
      {
        address: '0x6F634F531ED0043B94527F68EC7861B4B1Ab110d',
        tokenFaucets: ['0xc777e1db58c386b8827bc1321fc2fef03ee5a7b7'],
      },
      {
        address: '0xbe55435BdA8f0A2A20D2Ce98cC21B0AF5bfB7c83',
        tokenFaucets: ['0xd7bb81038d60e3530b9d550cd17de605bd27b937'],
      },
    ],
  })

export const V3_PRIZE_POOL_SUPPORTED_CHAIN_IDS =
  Object.keys(V3_PRIZE_POOLS).map(Number)

interface PrizePoolAddresses {
  metadata: ContractMetadata
  prizePool: string
  token: string
  ticket: string
  sponsorship: string
  prizeStrategy: string
  tokenFaucets: {
    tokenFaucet: string
    asset: string
    measure: string
  }[]
}

/**
 * Fetches related contract addresses for individual prize pools and updates the KV.
 * @param {*} event
 * @param {*} chainId The chain id to refresh prize pools on
 * @returns
 */
export const updateV3PrizePools = async (
  event: ScheduledEvent | FetchEvent,
  chainId: number,
) => {
  const rootContractMetadatas = V3_PRIZE_POOLS[chainId]
  return updateHandler<PrizePoolAddresses>(
    event,
    chainId,
    rootContractMetadatas,
    getV3PrizePoolAddressesKey,
    getV3PrizePoolRelatedContractAddresses,
  )
}

/**
 * Fetches related contract addresses for individual pods
 * @param chainId
 * @param podAddress
 * @returns
 */
const getV3PrizePoolRelatedContractAddresses = async (
  event: FetchEvent | ScheduledEvent,
  chainId: number,
  rootContractMetadata: V3PrizePoolContractMetadata,
) => {
  const prizePoolContract = contract(
    rootContractMetadata.address,
    MinimalPrizePoolAbi,
    rootContractMetadata.address,
  )
  let batchCalls = []
  batchCalls.push(prizePoolContract.token().tokens().prizeStrategy())

  rootContractMetadata.tokenFaucets.forEach((tokenFaucet) => {
    const tokenFaucetContract = contract(
      tokenFaucet,
      MinimalTokenFaucetAbi,
      tokenFaucet,
    )
    batchCalls.push(tokenFaucetContract.measure().asset())
  })

  let response = await batch(chainId, ...batchCalls)
  batchCalls = []

  const relatedAddresses: PrizePoolAddresses = {
    metadata: rootContractMetadata,
    prizePool: rootContractMetadata.address,
    token: response[rootContractMetadata.address].token[0],
    ticket: response[rootContractMetadata.address].tokens[0][1],
    sponsorship: response[rootContractMetadata.address].tokens[0][0],
    prizeStrategy: response[rootContractMetadata.address].prizeStrategy[0],
    tokenFaucets: rootContractMetadata.tokenFaucets.map((tokenFaucet) => ({
      tokenFaucet,
      measure: response[tokenFaucet].measure[0],
      asset: response[tokenFaucet].asset[0],
    })),
  }

  return relatedAddresses
}

const MinimalPrizePoolAbi = [
  {
    inputs: [],
    name: 'token',
    outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokens',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'prizeStrategy',
    outputs: [
      {
        internalType: 'contract TokenListenerInterface',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const MinimalTokenFaucetAbi = [
  {
    inputs: [],
    name: 'asset',
    outputs: [
      { internalType: 'contract IERC20Upgradeable', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'measure',
    outputs: [
      { internalType: 'contract IERC20Upgradeable', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
