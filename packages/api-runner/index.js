import { usePools, usePoolByAddress } from 'lib/hooks/usePool'
import { usePoolContracts } from 'lib/hooks/usePoolContracts'

const nodeFetch = require('node-fetch')

function path(request) {
  const _url = new URL(request.url)
  const pathname = _url.pathname
  return pathname
}

export async function pools(request, fetch = nodeFetch) {
  const pathname = path(request).split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)
  const poolContracts = usePoolContracts(chainId)
  console.log(poolContracts)

  const pools = await usePools(chainId, poolContracts, fetch)
  console.log('Done!')

  return pools
}

export async function pool(request, fetch = nodeFetch) {
  const pathname = path(request).split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)
  const poolAddress = pathname.split('/')[3]

  const pool = await usePoolByAddress(chainId, poolAddress, fetch)
  return pool
}
