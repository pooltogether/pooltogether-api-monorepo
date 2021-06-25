import { prizePoolContracts } from '@pooltogether/current-pool-data'
import { getPoolKey } from 'lib/utils/getPoolKey'

// /pools/[chainId].json
export const getPools = async (request) => {
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

  const poolAddresses = getDefaultPoolAddresses(chainId)

  const promises = poolAddresses.map((poolAddress) => POOLS.get(getPoolKey(chainId, poolAddress)))

  return (await Promise.all(promises)).filter(Boolean).map(JSON.parse)
}

const getDefaultPoolAddresses = (chainId) =>
  [...prizePoolContracts[chainId].governance, ...prizePoolContracts[chainId].community].map(
    (pool) => pool.prizePool.address
  )
