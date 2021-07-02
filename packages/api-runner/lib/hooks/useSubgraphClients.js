import { GraphQLClient } from 'graphql-request'
import {
  LOOTBOX_GRAPH_URIS,
  POOLTOGETHER_SUBGRAPHS,
  UNISWAP_GRAPH_URIS
} from 'lib/constants/subgraphUris'
import { fetch } from '../../index'

export const useSubgraphClients = (chainId, versions) => {
  return versions.map((version) => POOLTOGETHER_SUBGRAPHS[chainId][version])
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
      [version]: new GraphQLClient(POOLTOGETHER_SUBGRAPHS[chainId][version], {
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
