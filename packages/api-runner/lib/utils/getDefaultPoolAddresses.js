import { prizePoolContracts } from '@pooltogether/current-pool-data'

export const getDefaultPoolAddresses = (chainId) => {
  console.log({chainId})
  console.log(prizePoolContracts)
  console.log(prizePoolContracts[chainId])
  return prizePoolContracts[chainId].governance.map((pool) => pool.prizePool.address)
}
