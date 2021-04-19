import { CONTRACT_ADDRESSES } from 'lib/constants/contracts'
import { getLootBoxSubgraphClient } from 'lib/hooks/useSubgraphClients'
import { lootBoxQuery } from 'lib/queries/lootBoxQuery'

export const getGraphLootBoxData = async (chainId, tokenIds, fetch) => {
  if (tokenIds.length === 0) return []

  const graphQLClient = getLootBoxSubgraphClient(chainId, fetch)

  const lootBoxAddress = CONTRACT_ADDRESSES[chainId]?.lootBox?.toLowerCase()

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
