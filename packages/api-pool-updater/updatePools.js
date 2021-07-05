import { log } from '../../utils/sentry'
import { getPools } from '@pooltogether/api-runner'
import { getPoolsKey } from '../../utils/kvKeys'

/**
 * Call getPools and store the response in cloudflares KV
 * @param {*} event
 * @param {*} chainId The chain id to refresh pools for
 * @returns
 */
export const updatePools = async (event, chainId) => {
  const pools = await getPools(chainId, fetch)

  if (!pools || pools.length === 0) {
    event.waitUntil(log(new Error('No pools fetched during update'), event.request))
  }

  event.waitUntil(
    POOLS.put(getPoolsKey(chainId), JSON.stringify(pools), {
      metadata: {
        lastUpdated: new Date(Date.now()).toUTCString()
      }
    })
  )
  // event.waitUntil(POOLS.put(`${chainId} - Last updated`, new Date(Date.now()).toUTCString()))
  return true
}
