import { gql } from 'graphql-request'

import {
  getSushiBarSubgraphClient,
  getSushiExchangeSubgraphClient
} from 'lib/hooks/useSubgraphClients'

export const getSushiYieldSourceData = async (chainId, addresses, fetch, blockNumber = -1) => {
  // Only supported on mainnet
  if (chainId !== 1) {
    return {}
  }

  const sushiBarGraphQLClient = getSushiBarSubgraphClient(chainId, fetch)
  const sushiExchangeGraphQLClient = getSushiExchangeSubgraphClient(chainId, fetch)

  if (!sushiBarGraphQLClient) return null

  console.log('getting sushibar and exchange data from the graph ...')
  const sushiBarResponse = await sushiBarGraphQLClient.request(sushiBarQuery)
  const sushiExchangeResponse = await sushiExchangeGraphQLClient.request(sushiFactoryQuery)

  console.log('got sushibar & exchange from graph')

  console.log(sushiBarResponse)
  console.log(sushiExchangeResponse)

  const data = {
    sushiBarResponse,
    sushiExchangeResponse
  }

  return data
}

const sushiBarQuery = gql`
  query barQuery($id: String! = "0x8798249c2e607446efb7ad49ec89dd1865ff4272") {
    bar(id: $id) {
      id
      totalSupply
      ratio
    }
  }
`

export const sushiFactoryQuery = gql`
  query factoryQuery($id: String! = "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac") {
    factory(id: $id) {
      id
      volumeUSD
      oneDay
      twoDay
    }
  }
`

// export const factoryTimeTravelQuery = gql`
//   query factoryTimeTravelQuery(
//     $id: String! = "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac"
//     $block: Block_height!
//   ) {
//     factory(id: $id, block: $block) {
//       id
//       volumeUSD
//     }
//   }
// `
