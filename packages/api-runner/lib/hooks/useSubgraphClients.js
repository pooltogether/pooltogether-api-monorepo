import {
  LOOTBOX_GRAPH_URIS,
  POOLTOGETHER_SUBGRAPH_URIS,
  UNISWAP_GRAPH_URIS
} from '@pooltogether/current-pool-data'
import { NETWORK } from '@pooltogether/utilities'
import { GraphQLClient } from 'graphql-request'

import { fetch } from '../../index'

export const useSubgraphClients = (chainId, versions) => {
  return versions.map((version) => POOLTOGETHER_SUBGRAPH_URIS[chainId][version])
}

export const getSubgraphVersionsFromContracts = (poolContracts) => [
  ...new Set(poolContracts.map((pool) => pool.subgraphVersion))
]

export const getUniswapSubgraphClient = (chainId) =>
  new GraphQLClient(UNISWAP_GRAPH_URIS[chainId], { fetch })

export const getSubgraphClientsByVersionFromContracts = (poolContracts, chainId) =>
  getSubgraphVersionsFromContracts(poolContracts).reduce(
    (accumulator, version) => ({
      ...accumulator,
      [version]: new GraphQLClient(POOLTOGETHER_SUBGRAPH_URIS[chainId][version], {
        fetch
      })
    }),
    {}
  )

export const getPoolAddressesBySubgraphVersionFromContracts = (poolContracts) => {
  return poolContracts.reduce((accumulator, pool) => {
    return {
      ...accumulator,
      [pool.subgraphVersion]: [].concat(
        pool.prizePool.address,
        accumulator?.[pool.subgraphVersion] ? accumulator[pool.subgraphVersion] : []
      )
    }
  }, {})
}

export const getLootBoxSubgraphClient = (chainId) =>
  new GraphQLClient(LOOTBOX_GRAPH_URIS[chainId], {
    fetch
  })

/**
 * BSC Subgraphs use `derivedBNB` rather than `derivedETH`
 * @param {*} chainId
 * @returns
 */
export const getDexNativeCurrencyKey = (chainId) => {
  switch (chainId) {
    case NETWORK.bsc:
      return 'derivedBNB'
    case NETWORK.celo:
      return 'derivedCUSD'
    default:
      return 'derivedETH'
  }
}
