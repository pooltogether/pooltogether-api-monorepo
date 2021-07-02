import { contract } from '@pooltogether/etherplex'

import { batch } from 'lib/cloudflare-workers-batch'
import { PodAbi } from '../../abis/Pod'

export const getPod = async (chainId, podAddress) => {
  const podContract = contract(podAddress, PodAbi, podAddress)
  let batchCalls = []

  batchCalls.push(
    podContract
      .owner()
      .name()
      .symbol()
      .decimals()
      .prizePool()
      .manager()
      .faucet()
      .ticket()
      .token()
      .tokenDrop()
  )

  const response = await batch(chainId, ...batchCalls)

  return {
    owner: response[podAddress].owner[0],
    name: response[podAddress].name[0],
    symbol: response[podAddress].symbol[0],
    decimals: response[podAddress].decimals[0],
    prizePool: response[podAddress].prizePool[0],
    manager: response[podAddress].manager[0],
    faucet: response[podAddress].faucet[0],
    ticket: response[podAddress].ticket[0],
    token: response[podAddress].token[0],
    tokenDrop: response[podAddress].tokenDrop[0]
  }
}
