import { GraphQLClient } from 'graphql-request'
import {
  LOOTBOX_GRAPH_URIS,
  POOLTOGETHER_SUBGRAPHS,
  UNISWAP_GRAPH_URIS
} from 'lib/constants/subgraphUris'

export const useSubgraphClients = (chainId, versions) => {
  return versions.map((version) => POOLTOGETHER_SUBGRAPHS[chainId][version])
}

export const getSubgraphVersionsFromContracts = (poolContracts) => [
  ...new Set(poolContracts.map((pool) => pool.subgraphVersion))
]

export const getUniswapSubgraphClient = (chainId) =>
  new GraphQLClient(UNISWAP_GRAPH_URIS[chainId], { fetch: theGraphCustomFetch })

export const getSubgraphClientsByVersionFromContracts = (poolContracts, chainId) =>
  getSubgraphVersionsFromContracts(poolContracts).reduce(
    (accumulator, version) => ({
      ...accumulator,
      [version]: new GraphQLClient(POOLTOGETHER_SUBGRAPHS[chainId][version], {
        fetch: theGraphCustomFetch
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
    fetch: theGraphCustomFetch
  })

const retryCodes = [408, 500, 502, 503, 504, 522, 524]
const sleep = async (retry) => await new Promise((r) => setTimeout(r, 500 * retry))
const theGraphCustomFetch = async (request, options, retry = 0) =>
  fetch(request, options)
    .then(async (response) => {
      if (response.ok) return response

      console.log('Here', retry, request)

      if (retry < 3 && retryCodes.includes(response.status)) {
        await sleep(retry)
        return theGraphCustomFetch(request, options, retry + 1)
      }

      throw new Error(JSON.stringify(response))
    })
    .catch((reason) => {
      console.log(reason)
      return reason
    })
