import { GraphQLClient } from 'graphql-request'
import {
  LOOTBOX_GRAPH_URIS,
  POOLTOGETHER_SUBGRAPHS,
  UNISWAP_GRAPH_URIS,
  SUSHI_BAR_GRAPH_URIS,
  SUSHI_EXCHANGE_GRAPH_URIS
} from 'lib/constants/subgraphUris'

export const useSubgraphClients = (chainId, versions) => {
  return versions.map((version) => POOLTOGETHER_SUBGRAPHS[chainId][version])
}

export const getSubgraphVersionsFromContracts = (poolContracts) => [
  ...new Set(poolContracts.map((pool) => pool.subgraphVersion))
]

export const getUniswapSubgraphClient = (chainId, fetch) =>
  new GraphQLClient(UNISWAP_GRAPH_URIS[chainId], { fetch })

export const getSushiBarSubgraphClient = (chainId, fetch) =>
  new GraphQLClient(SUSHI_BAR_GRAPH_URIS[chainId], { fetch })

export const getSushiExchangeSubgraphClient = (chainId, fetch) =>
  new GraphQLClient(SUSHI_EXCHANGE_GRAPH_URIS[chainId], { fetch })

export const getSubgraphClientsByVersionFromContracts = (poolContracts, chainId, fetch) =>
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

export const getLootBoxSubgraphClient = (chainId, fetch) =>
  new GraphQLClient(LOOTBOX_GRAPH_URIS[chainId], {
    fetch
  })
