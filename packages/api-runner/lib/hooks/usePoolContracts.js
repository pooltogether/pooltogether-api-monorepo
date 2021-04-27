import { prizePoolContracts } from '@pooltogether/current-pool-data'

export function usePoolContracts(chainId) {
  return [
    ...prizePoolContracts[chainId].governance,
    ...prizePoolContracts[chainId].community.map((contract) => ({
      ...contract,
      isCommunityPool: true
    }))
  ]
}

export function usePoolContract(chainId, poolAddress) {
  const poolContracts = usePoolContracts(chainId)
  return poolContracts.find(
    (contract) => contract.prizePool.address.toLowerCase() === poolAddress.toLowerCase()
  )
}
