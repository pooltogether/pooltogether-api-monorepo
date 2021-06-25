import { getPoolKey } from 'lib/utils/getPoolKey'

// /pool/[chainId]/[poolAddress].json
export const getPool = async (request) => {
  const _url = new URL(request.url)
  const pathname = _url.pathname.split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)
  const poolAddress = pathname.split('/')[3]
  return JSON.parse(await POOLS.get(getPoolKey(chainId, poolAddress)))
}
