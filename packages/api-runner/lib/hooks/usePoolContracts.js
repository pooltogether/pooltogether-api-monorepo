import { prizePoolContracts } from '@pooltogether/current-pool-data'

export function usePoolContracts(chainId) {
  return [...prizePoolContracts[chainId].governance]
}

export function usePoolContract(chainId, poolAddress) {
  const poolContracts = usePoolContracts(chainId)
  return poolContracts.find(
    (contract) => contract.prizePool.address.toLowerCase() === poolAddress.toLowerCase()
  )
}
