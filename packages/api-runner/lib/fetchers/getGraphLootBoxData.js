import { CONTRACT_ADDRESSES } from 'lib/constants/contracts'
import { getLootBoxSubgraphClient } from 'lib/hooks/useSubgraphClients'
import { lootBoxQuery } from 'lib/queries/lootBoxQuery'

export const getGraphLootBoxData = async (chainId, prizes, fetch, blockNumber = -1) => {
  if (prizes.length === 0) return []

  const graphQLClient = getLootBoxSubgraphClient(chainId, fetch)
  try {
    const lootBoxAddress = CONTRACT_ADDRESSES[chainId]?.lootBox?.toLowerCase()
    const query = lootBoxesQuery(lootBoxAddress, prizes)
    const response = await graphQLClient.request(query)
    return response
  } catch (error) {
    console.error(error)
    return []
  }
}
