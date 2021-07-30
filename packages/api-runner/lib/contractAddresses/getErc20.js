import { contract } from '@pooltogether/etherplex'

import { batch } from 'lib/cloudflare-workers-batch'
import { ERC20Abi } from '../../abis/ERC20Abi'

export const getErc20 = async (tokenAddress, chainId) => {
  const tokenContract = contract(tokenAddress, ERC20Abi, tokenAddress)
  let batchCalls = []

  batchCalls.push(
    tokenContract
      .decimals()
      .name()
      .owner()
      .symbol()
  )

  const response = await batch(chainId, ...batchCalls)

  return {
    decimals: response[tokenAddress].decimals[0],
    name: response[tokenAddress].name[0],
    owner: response[tokenAddress].owner[0],
    symbol: response[tokenAddress].symbol[0]
  }
}
