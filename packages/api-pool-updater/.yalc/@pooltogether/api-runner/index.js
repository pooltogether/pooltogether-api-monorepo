import { usePoolContracts } from 'lib/hooks/usePoolContracts'
import { usePools, usePoolByAddress } from 'lib/hooks/usePool'
import { getPodContractAddresses as _getPodContractAddresses } from 'lib/contractAddresses/getPodContractAddresses'
import { getDefaultPoolAddresses } from 'lib/utils/getDefaultPoolAddresses'
import { INFURA_ID, setInfuraId } from 'lib/utils/infura'
import { QUICKNODE_ID, setQuicknodeId } from 'lib/utils/quickNode'
import { fetch, setFetch } from 'lib/utils/fetch'

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

export {
  getDefaultPoolAddresses,
  INFURA_ID,
  setInfuraId,
  fetch,
  setFetch,
  QUICKNODE_ID,
  setQuicknodeId
}
