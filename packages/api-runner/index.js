import {
  usePools,
  usePoolByAddress,
  usePoolGraphDataByAddress,
  usePoolsGraphData
} from 'lib/hooks/usePool'
import { usePoolContracts } from 'lib/hooks/usePoolContracts'

const nodeFetch = require('node-fetch')

function path(request) {
  const _url = new URL(request.url)
  const pathname = _url.pathname
  return pathname
}

function extractRequestMetadata(request) {
  const pathname = path(request).split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)
  const poolAddress = pathname.split('/')[3]
  const poolContracts = usePoolContracts(chainId)

  return {
    pathname,
    chainId,
    poolContracts,
    poolAddress
  }
}

export async function pools(request, fetch = nodeFetch) {
  const { chainId, poolContracts } = extractRequestMetadata(request)
  const pools = await usePools(chainId, poolContracts, fetch)
  return pools
}

export async function pool(request, fetch = nodeFetch) {
  const { chainId, poolAddress } = extractRequestMetadata(request)
  const pool = await usePoolByAddress(chainId, poolAddress, fetch)
  return pool
}

export async function poolsGraphData(request, fetch = nodeFetch) {
  const { chainId, poolContracts } = extractRequestMetadata(request)
  const poolsGraphData = await usePoolsGraphData(chainId, poolContracts, fetch)

  return poolsGraphData
}

export async function poolGraphData(request, fetch = nodeFetch) {
  const { chainId, poolAddress } = extractRequestMetadata(request)
  const poolGraphData = await usePoolGraphDataByAddress(chainId, poolAddress, fetch)

  return poolGraphData
}
