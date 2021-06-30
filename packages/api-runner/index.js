import { usePools } from 'lib/hooks/usePool'
import { usePoolContracts } from 'lib/hooks/usePoolContracts'
import { usePoolByAddress } from 'lib/hooks/usePool'

const nodeFetch = require('node-fetch')

export async function getPool(chainId, poolAddress, fetch = nodeFetch) {
  const pool = await usePoolByAddress(chainId, poolAddress, fetch)
  return pool
}

// TODO: Accept a list of addresses
// Currently used to fetch and populate the KV for all of the pools
export async function getPools(chainId, fetch = nodeFetch) {
  const poolContracts = usePoolContracts(chainId)
  console.log('getPools', chainId, JSON.stringify(poolContracts))
  const pools = await usePools(chainId, poolContracts, fetch)
  return pools
}
