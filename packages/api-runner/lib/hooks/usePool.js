import { usePoolContract } from 'lib/hooks/usePoolContracts'
import { getPools } from 'lib/fetchers/getPools'

/**
 *
 * @param {*} poolAddress
 * @returns
 */
export const usePoolByAddress = async (chainId, poolAddress, fetch) => {
  const poolContract = await usePoolContract(chainId, poolAddress)

  return await usePool(chainId, poolContract, fetch)
}

/**
 *
 * @param {*} label
 * @returns
 */
const usePool = async (chainId, poolContract, fetch) => {
  const usePoolData = await usePools(chainId, [poolContract], fetch)
  return usePoolData?.[0]
}

/**
 *
 * @param {*} poolContracts
 * @returns
 */
export const usePools = async (chainId, poolContracts, fetch) => {
  const contracts = poolContracts.filter(Boolean)
  const pools = await getPools(chainId, contracts, fetch)

  return pools
}
