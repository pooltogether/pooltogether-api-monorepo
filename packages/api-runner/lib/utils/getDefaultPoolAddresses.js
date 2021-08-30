import { prizePoolContracts } from '@pooltogether/current-pool-data'

export const getDefaultPoolAddresses = (chainId) => {
  return prizePoolContracts[chainId].governance.map((pool) => pool.prizePool.address)
}
