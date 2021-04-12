const { getPoolGraphData } = require('lib/fetchers/getPoolGraphData')

/**
 *
 * @param {*} chainId
 * @param {*} readProvider
 * @param {*} poolContracts
 * @returns
 */
export const getPools = async (chainId, poolContracts) => {
  return await getPoolGraphData(chainId, poolContracts)
}
