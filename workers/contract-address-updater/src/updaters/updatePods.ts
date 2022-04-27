import { getV3PodsKey } from '../../../../utils/kvKeys'
import { contract } from '@pooltogether/etherplex'
import { batch } from '../batch'
import { PodAbi } from '../../../../abis/PodAbi'
import { TokenDropAbi } from '../../../../abis/TokenDropAbi'
import { NETWORK } from '../../../../constants/chains'
import { updateHandler } from '../updateHandler'
import { ContractMetadata } from '../interfaces'

const PODS: { [chainId: number]: ContractMetadata[] } = Object.freeze({
  [NETWORK.mainnet]: [
    // Dai Pod
    { address: '0x2f994e2E4F3395649eeE8A89092e63Ca526dA829' },
    // USDC Pod
    { address: '0x386EB78f2eE79AddE8Bdb0a0e27292755ebFea58' },
  ],
  // Binance
  [NETWORK.binance]: [],
  // Polygon
  [NETWORK.polygon]: [],
  // Rinkeby
  [NETWORK.rinkeby]: [
    // Dai Pod
    { address: '0x4A26b34A902045CFb573aCb681550ba30AA79783' },
  ],
})

export const PODS_SUPPORTED_CHAIN_IDS = Object.keys(PODS).map(Number)

interface PodAddresses {
  metadata: ContractMetadata
  address: string
  owner: string
  name: string
  symbol: string
  decimals: string
  prizePool: string
  manager: string
  faucet: string
  ticket: string
  token: string
  tokenDrop: string
  tokenDropDripToken: string
}

/**
 * Fetches related contract addresses for individual pods and updates the KV.
 * @param {*} event
 * @param {*} chainId The chain id to refresh pods on
 * @returns
 */
export const updatePods = async (
  event: ScheduledEvent | FetchEvent,
  chainId: number,
) => {
  const rootAddresses = PODS[chainId]
  return updateHandler<PodAddresses>(
    event,
    chainId,
    rootAddresses,
    getV3PodsKey,
    getPodRelatedContractAddresses,
  )
}

/**
 * Fetches related contract addresses for individual pods
 * @param chainId
 * @param podAddress
 * @returns
 */
const getPodRelatedContractAddresses = async (
  event: ScheduledEvent | FetchEvent,
  chainId: number,
  rootContractMetadata: ContractMetadata,
) => {
  const podAddress = rootContractMetadata.address
  const podContract = contract(podAddress, PodAbi, podAddress)
  let batchCalls = []

  batchCalls.push(
    podContract
      .owner()
      .name()
      .symbol()
      .decimals()
      .prizePool()
      .manager()
      .faucet()
      .ticket()
      .token()
      .tokenDrop(),
  )

  let response = await batch(chainId, ...batchCalls)

  const podAddresses: PodAddresses = {
    metadata: rootContractMetadata,
    address: podAddress,
    owner: response[podAddress].owner[0],
    name: response[podAddress].name[0],
    symbol: response[podAddress].symbol[0],
    decimals: response[podAddress].decimals[0],
    prizePool: response[podAddress].prizePool[0],
    manager: response[podAddress].manager[0],
    faucet: response[podAddress].faucet[0],
    ticket: response[podAddress].ticket[0],
    token: response[podAddress].token[0],
    tokenDrop: response[podAddress].tokenDrop[0],
    tokenDropDripToken: null,
  }

  const tokenDropAbiContract = contract(
    podAddresses.tokenDrop,
    TokenDropAbi,
    podAddresses.tokenDrop,
  )

  response = await batch(chainId, tokenDropAbiContract.asset())

  podAddresses.tokenDropDripToken = response[podAddresses.tokenDrop].asset[0]

  return podAddresses
}
