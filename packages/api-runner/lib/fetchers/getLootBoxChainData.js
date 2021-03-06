import { contract } from '@pooltogether/etherplex'

import { CustomERC721Abi as ERC721Abi } from 'abis/CustomERC721'
import { batch } from 'lib/cloudflare-workers-batch'

const getErc721BatchName = (prizeAddress, tokenId) => `erc721Award-${prizeAddress}-${tokenId}`

/**
 *
 * @param {*} pools
 * @param {*} chainId
 * @returns
 */
export const getLootBoxChainData = async (pools, chainId) => {
  const erc721AwardsToFetchMetadataFor = []

  pools.forEach((pool) => {
    if (!pool.prize.lootBox) return

    const lootBoxErc721Tokens = pool.prize.lootBox.erc721Tokens

    // LootBox ERC721 awards
    if (lootBoxErc721Tokens?.length > 0) {
      lootBoxErc721Tokens.forEach((erc721) => {
        const tokenId = erc721.tokenId
        const address = erc721.erc721Entity.id

        erc721AwardsToFetchMetadataFor.push({ address, tokenId })
      })
    }
  })

  // Get External Erc721 Metadata (unfortunately many batch calls)
  const additionalBatchedCalls = await Promise.all([
    ...erc721AwardsToFetchMetadataFor.map(async (erc721Award) => {
      return {
        id: getErc721BatchName(erc721Award.address, erc721Award.tokenId),
        uri: await getErc721TokenUri(chainId, erc721Award.address, erc721Award.tokenId)
      }
    })
  ])

  return updatePoolsWithLootBoxChainData(pools, additionalBatchedCalls)
}

const getErc721TokenUri = async (chainId, erc721Address, tokenId) => {
  const erc721Contract = contract(
    getErc721BatchName(erc721Address, tokenId),
    ERC721Abi,
    erc721Address
  )
  let tokenURI = await _tryMetadataMethod(
    chainId,
    erc721Address,
    erc721Contract,
    tokenId,
    'tokenURI'
  )

  if (!tokenURI) {
    tokenURI = await _tryMetadataMethod(
      chainId,
      erc721Address,
      erc721Contract,
      tokenId,
      'tokenMetadata'
    )
  }
  return tokenURI
}

const _tryMetadataMethod = async (
  chainId,
  contractAddress,
  etherplexTokenContract,
  tokenId,
  method
) => {
  let tokenValues

  try {
    tokenValues = await batch(chainId, etherplexTokenContract[method](tokenId))
    const erc721BatchName = getErc721BatchName(contractAddress, tokenId)
    return tokenValues[erc721BatchName][method][0]
  } catch (e) {
    console.warn(
      `NFT at '${contractAddress}' with tokenId ${tokenId} likely does not support metadata using method: ${method}():`,
      e.message
    )
    console.log(e)
  }
}

const updatePoolsWithLootBoxChainData = (pools, additionalBatchCalls) => {
  pools.forEach((pool) => {
    if (!pool.prize.lootBox) return

    const erc721Tokens = pool.prize.lootBox.erc721Tokens

    if (erc721Tokens?.length > 0) {
      erc721Tokens.forEach((erc721) => {
        const tokenId = erc721.tokenId
        const address = erc721.erc721Entity.id

        const erc721Uri = additionalBatchCalls.find(
          (response) => response.id === getErc721BatchName(address, tokenId)
        )?.uri

        erc721.erc721Entity.uri = erc721Uri
      })
    }
  })

  return pools
}
