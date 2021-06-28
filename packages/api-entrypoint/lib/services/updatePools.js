import { log } from 'lib/utils/sentry'
import { getPools } from '@pooltogether/api-runner'
import { getPoolKey } from 'lib/utils/getPoolKey'

// /update/[chainId]
export const updatePools = async (event, chainId) => {
  try {
    const pools = await getPools(chainId, fetch)

    if (!pools || pools.length === 0) {
      event.waitUntil(log(new Error('No pools fetched during update'), event.request))
    }

    await POOLS.put(getPoolKey(chainId), JSON.stringify(pools))
    event.waitUntil(
      POOLS.put(`Network ${chainId} last updated`, new Date(Date.now()).toUTCString())
    )
    return null
  } catch (e) {
    event.waitUntil(log(e, event.request))
    return null
  }
}
