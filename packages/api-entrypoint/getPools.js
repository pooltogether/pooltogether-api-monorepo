import { getDefaultPoolAddresses } from '@pooltogether/api-runner'

import { getPoolsKey } from '../../utils/getPoolsKey'
import { log } from '../../utils/sentry'

// /pools/[chainId].json
export const getPools = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[2], 10)

    // TODO: Validate addresses and allow users to request what pools they want
    // const POOL_ADDRESSES_QUERY_PARAM = 'poolAddresses'
    // let poolAddresses = _url.searchParams.get(POOL_ADDRESSES_QUERY_PARAM)
    // if (poolAddresses) {
    //   poolAddresses = poolAddresses.split(',')
    // } else {
    //   poolAddresses = getDefaultPoolAddresses(chainId)
    // }

    const storedPools = JSON.parse(await POOLS.get(getPoolsKey(chainId)))
    if (!storedPools) return null

    return filterStoredPoolsForChain(chainId, storedPools)
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}

const filterStoredPoolsForChain = (chainId, storedPools) => {
  const poolAddresses = getDefaultPoolAddresses(chainId)

  return poolAddresses
    .map((poolAddress) => storedPools.find((pool) => pool.prizePool.address === poolAddress))
    .filter(Boolean)
}
