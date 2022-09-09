import { ALL_CHAINS } from '../../../constants/chains'
import { InfuraProvider, JsonRpcProvider } from '@ethersproject/providers'

// NOTE: A lot of this is just copy pasta from @pooltogether/wallet-connection

/**
 * Chains supported by Infura
 */
export const INFURA_CHAIN_IDS = Object.freeze([
  // Ethereum
  1, 3, 4, 5, 42,
  // Polygon
  137, 80001,
  // Avalanche
  43114, 43113,
  // Optimism
  10, 69,
  // Arbitrum
  42161, 421611,
])

/**
 * Returns metadata for the request chain id
 * @param {*} chainId
 * @returns
 */
export const getChain = (chainId) =>
  ALL_CHAINS.find((chain) => chain.id === chainId)

/**
 *
 * @param chainIds
 * @returns
 */
export const getReadProviders = (chainIds, infuraApiKey) => {
  const providers = {}
  chainIds.forEach((chainId) => {
    providers[chainId] = getReadProvider(chainId, infuraApiKey)
  })
  return providers
}

/**
 * Creates a provider for the given chain id if available.
 * Attempts to use API keys for RPC providers first.
 * Falls back to mainnet if chain id provided is not supported.
 * @param chainId
 * @param apiKeys
 * @returns
 */
export const getReadProvider = (chainId, infuraApiKey) => {
  if (!!infuraApiKey && INFURA_CHAIN_IDS.includes(chainId)) {
    return new InfuraProvider(chainId, infuraApiKey)
  }

  const chainData = getChain(chainId)
  if (!chainData) {
    throw new Error(`getReadProvider | Chain id ${chainId} not supported.`)
  }

  const rpcUrl = chainData.rpcUrls[0]
  return new JsonRpcProvider(rpcUrl, chainId)
}
