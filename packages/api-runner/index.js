import { usePools, usePoolByAddress } from 'lib/hooks/usePool'
import { usePoolContracts } from 'lib/hooks/usePoolContracts'

function path(request) {
  const _url = new URL(request.url)
  const pathname = _url.pathname
  return pathname
}

export async function pools(request) {
  const pathname = path(request).split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)
  const poolContracts = usePoolContracts(chainId)

  const pools = await usePools(chainId, poolContracts)

  return pools
}

export async function pool(request) {
  const pathname = path(request).split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)
  const poolAddress = pathname.split('/')[3]

  console.log(pathname)
  console.log(poolAddress)
  const pool = await usePoolByAddress(chainId, poolAddress)

  return pool
}
