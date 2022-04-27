import { getDefaultPoolAddresses } from '@pooltogether/api-runner'

import { log } from '../../utils/sentry'
import { getPools } from '@pooltogether/api-runner'
import { getV3PoolsKey } from '../../utils/kvKeys'

/**
 * Call getPools and store the response in cloudflares KV
 * @param {*} event
 * @param {*} chainId The chain id to refresh pools for
 * @returns
 */
export const updatePools = async (event, chainId, forceUpdate = false) => {
  const poolsToUpdate = await getPools(chainId)

  if (!poolsToUpdate) {
    event.waitUntil(log(new Error('No pools fetched during update'), event.request))
    return false
  } else if (forceUpdate) {
    if (poolsToUpdate.length === poolCountForChain(chainId)) {
      event.waitUntil(POOLS.put(getV3PoolsKey(chainId), JSON.stringify(poolsToUpdate)), {
        metadata: {
          lastUpdated: new Date(Date.now()).toUTCString()
        }
      })
      event.waitUntil(POOLS.put(`${chainId} - Last updated`, new Date(Date.now()).toUTCString()))
    } else {
      event.waitUntil(log(new Error('No pools updated during forced update'), event.request))
      return false
    }
  } else {
    // Only update the pools in the KV with new data
    const storedPools = JSON.parse(await POOLS.get(getV3PoolsKey(chainId))) || []
    poolsToUpdate.map((poolToUpdate) => {
      const oldPoolIndex = storedPools.findIndex(
        (storedPool) => storedPool.prizePool.address === poolToUpdate.prizePool.address
      )
      if (oldPoolIndex === -1) {
        storedPools.push(poolToUpdate)
      } else {
        storedPools[oldPoolIndex] = poolToUpdate
      }
    })

    event.waitUntil(POOLS.put(getV3PoolsKey(chainId), JSON.stringify(storedPools)), {
      metadata: {
        lastUpdated: new Date(Date.now()).toUTCString()
      }
    })
    event.waitUntil(POOLS.put(`${chainId} - Last updated`, new Date(Date.now()).toUTCString()))
    return true
  }
}

const poolCountForChain = (chainId) => getDefaultPoolAddresses(chainId).length
