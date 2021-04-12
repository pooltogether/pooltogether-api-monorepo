import { PRIZE_POOL_CONTRACTS } from 'lib/constants/contracts'

export function usePoolContracts(chainId) {
  return [
    ...PRIZE_POOL_CONTRACTS[chainId].governance,
    ...PRIZE_POOL_CONTRACTS[chainId].community.map((contract) => ({
      ...contract,
      isCommunityPool: true
    }))
  ]
}

// export function useCommunityPoolContracts(chainId) {
//   return PRIZE_POOL_CONTRACTS[chainId].community.map((contract) => ({
//     ...contract,
//     isCommunityPool: true
//   }))
// }

// export function useGovernancePoolContracts(chainId) {
//   return PRIZE_POOL_CONTRACTS[chainId].governance
// }

export function usePoolContract(chainId, poolAddress) {
  const poolContracts = usePoolContracts(chainId)
  return poolContracts.find(
    (contract) => contract.prizePool.address.toLowerCase() === poolAddress.toLowerCase()
  )
}

// export function usePoolContractBySymbol(chainId, symbol) {
//   const poolContracts = usePoolContracts(chainId)
//   if (!symbol) return null
//   return poolContracts.find((contract) => contract.symbol === symbol)
// }
