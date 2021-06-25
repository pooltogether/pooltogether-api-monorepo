import { getPools } from '@pooltogether/api-runner'
import { getPoolKey } from 'lib/utils/getPoolKey'

// /update/[chainId]
export const updatePools = async (chainId) => {
  const pools = await getPools(chainId, fetch)
  return await updatePoolStore(chainId, pools)
}

const updatePoolStore = async (chainId, pools) => {
  const promises = pools.map((pool) =>
    POOLS.put(getPoolKey(chainId, pool.prizePool.address), JSON.stringify(pool))
  )
  return await Promise.all(promises)
}
