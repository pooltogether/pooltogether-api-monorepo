import { CONTRACT_ADDRESSES } from 'lib/constants/contracts'
import { getLootBoxSubgraphClient } from 'lib/hooks/useSubgraphClients'
import { lootBoxQuery } from 'lib/queries/lootBoxQuery'

export const getGraphLootBoxData = async (chainId, poolData, blockNumber = -1) => {
  const graphQLClient = getLootBoxSubgraphClient(chainId)
  const tokenIds = [
    ...new Set(
      poolData
        .map((pool) => pool.prize.lootBoxes?.map((lootBox) => lootBox.id))
        .filter(Boolean)
        .flat()
    )
  ]

  const lootBoxAddress = CONTRACT_ADDRESSES[chainId]?.lootBox?.toLowerCase()

  const variables = {
    lootBoxAddress,
    tokenIds
  }

  const query = lootBoxQuery(blockNumber)

  if (tokenIds.length === 0) return []

  try {
    const response = await graphQLClient.request(query, variables)
    return response
  } catch (error) {
    console.error(error)
    return []
  }
}
