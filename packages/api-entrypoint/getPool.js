import { getPoolsKey } from '../../utils/kvKeys'
import { log } from '../../utils/sentry'

// /pool/[chainId]/[poolAddress].json
export const getPool = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[2], 10)
    const poolAddress = pathname.split('/')[3].toLowerCase()

    const storedPools = JSON.parse(await POOLS.get(getPoolsKey(chainId)))
    if (!storedPools) return null
    const pool = storedPools.find((pool) => pool.prizePool.address === poolAddress)

    if (!pool) return null
    return pool
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}
