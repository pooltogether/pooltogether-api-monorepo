import { usePoolContracts } from 'lib/hooks/usePoolContracts'
import { usePools, usePoolByAddress } from 'lib/hooks/usePool'
import { getPodContractAddresses as _getPodContractAddresses } from 'lib/contractAddresses/getPodContractAddresses'

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

export async function getPodContractAddresses(chainId, podAddress) {
  return await _getPodContractAddresses(chainId, podAddress)
}

export let INFURA_ID = null
export const setInfuraId = (id) => (INFURA_ID = id)

const nodeFetch = require('node-fetch')
export let fetch = nodeFetch.default
export const setFetch = (_fetch) => {
  fetch = _fetch.bind()
}
