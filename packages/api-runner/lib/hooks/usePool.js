import { usePoolContract } from 'lib/hooks/usePoolContracts'
import { getPools } from 'lib/fetchers/getPools'
import { getPoolGraphData } from 'lib/fetchers/getPoolGraphData'
import { getPoolChainData } from 'lib/fetchers/getPoolChainData'

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

// GRAPH DATA
// GRAPH DATA
// GRAPH DATA
// GRAPH DATA

export const usePoolGraphDataByAddress = async (chainId, poolAddress, fetch) => {
  const poolContract = await usePoolContract(chainId, poolAddress)
  return await usePoolGraphData(chainId, poolContract, fetch)
}

/**
 *
 * @param {*}
 * @returns
 */
const usePoolGraphData = async (chainId, poolContract, fetch) => {
  const poolGraphData = await usePoolsGraphData(chainId, [poolContract], fetch)
  return poolGraphData?.[0]
}

/**
 *
 * @param {*}
 * @returns
 */
export const usePoolsGraphData = async (chainId, poolContracts, fetch) => {
  const contracts = poolContracts.filter(Boolean)
  return await getPoolGraphData(chainId, contracts, fetch)
}
