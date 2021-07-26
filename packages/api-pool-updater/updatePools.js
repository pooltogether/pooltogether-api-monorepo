import { getDefaultPoolAddresses } from '@pooltogether/api-runner'

import { log } from '../../utils/sentry'
import { getPools } from '@pooltogether/api-runner'
import { getPoolsKey } from '../../utils/getPoolsKey'

/**
 * Call getPools and store the response in cloudflares KV
 * @param {*} event
 * @param {*} chainId The chain id to refresh pools for
 * @returns
 */
export const updatePools = async (event, chainId) => {
  const updatedPools = await getPools(chainId, fetch)

  if (!updatedPools) {
    event.waitUntil(log(new Error('No pools fetched during update'), event.request))
    return false
  }

  const storedPools = JSON.parse(await POOLS.get(getPoolsKey(chainId)))

  updatedPools.map((updatedPool) => {
    const oldPoolIndex = storedPools.findIndex(
      (storedPool) => storedPool.address === updatedPool.address
    )
    if (oldPoolIndex === -1) {
      storedPools.push(updatedPool)
    } else {
      storedPools[oldPoolIndex] = updatedPool
    }
  })

  event.waitUntil(POOLS.put(getPoolsKey(chainId), JSON.stringify(storedPools)), {
    metadata: {
      lastUpdated: new Date(Date.now()).toUTCString()
    }
  })
  event.waitUntil(POOLS.put(`${chainId} - Last updated`, new Date(Date.now()).toUTCString()))
  return true
}

const poolCountForChain = (chainId) => getDefaultPoolAddresses(chainId).length
