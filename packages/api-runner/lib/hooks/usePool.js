import { usePoolContract } from 'lib/hooks/usePoolContracts'
import { getPools } from 'lib/fetchers/getPools'

/**
 *
 * @param {*} poolAddress
 * @returns
 */
export const usePoolByAddress = async (chainId, poolAddress) => {
  const poolContract = await usePoolContract(chainId, poolAddress)
  return await usePool(chainId, poolContract)
}

/**
 *
 * @param {*} label
 * @returns
 */
const usePool = async (chainId, poolContract) => {
  const usePoolData = await usePools(chainId, [poolContract])

  return { ...usePoolData, data: usePoolData?.data?.[0] }
}

/**
 *
 * @param {*} poolContracts
 * @returns
 */
export const usePools = async (chainId, poolContracts) => {
  const contracts = poolContracts.filter(Boolean)
  return await getPools(chainId, contracts)
}
