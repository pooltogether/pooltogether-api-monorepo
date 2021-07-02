import { contractAddresses } from '@pooltogether/current-pool-data'

import { getLootBoxSubgraphClient } from 'lib/hooks/useSubgraphClients'
import { lootBoxQuery } from 'lib/queries/lootBoxQuery'

export const getLootBoxGraphData = async (chainId, tokenIds) => {
  if (tokenIds.length === 0) return []

  const graphQLClient = getLootBoxSubgraphClient(chainId)

  const lootBoxAddress = contractAddresses[chainId]?.lootBox?.toLowerCase()

  const variables = {
    lootBoxAddress,
    tokenIds
  }

  const query = lootBoxQuery()

  try {
    const response = await graphQLClient.request(query, variables)
    return response
  } catch (error) {
    console.error(error)
    return []
  }
}
