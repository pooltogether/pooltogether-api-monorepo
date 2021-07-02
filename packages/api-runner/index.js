import { usePoolContracts } from 'lib/hooks/usePoolContracts'
import { usePools, usePoolByAddress } from 'lib/hooks/usePool'
import { getPod as getPodChainData } from 'lib/contractAddresses/getPod'

export async function getPool(chainId, poolAddress) {
  const pool = await usePoolByAddress(chainId, poolAddress)
  return pool
}

// TODO: Accept a list of addresses
// Currently used to fetch and populate the KV for all of the pools
export async function getPools(chainId) {
  const poolContracts = usePoolContracts(chainId)
  const pools = await usePools(chainId, poolContracts)
  return pools
}

export async function getPod(chainId, podAddress) {
  return await getPodChainData(chainId, podAddress)
}

export let INFURA_ID = null
export const setInfuraId = (id) => (INFURA_ID = id)

const nodeFetch = require('node-fetch')
export let fetch = nodeFetch.default
export const setFetch = (_fetch) => (fetch = _fetch)
