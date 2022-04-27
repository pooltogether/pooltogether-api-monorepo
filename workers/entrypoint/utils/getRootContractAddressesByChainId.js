import { isAddress } from 'ethers/lib/utils'

/**
 * Returns related contract addresses stored in the KV
 * @param {*} chainId
 * @param {*} getRootContractKey
 * @returns
 */
export const getRootContractAddressesByChainId = async (chainId, getRootContractKey) => {
  const storedContracts = JSON.parse(await CONTRACT_ADDRESSES.get(getRootContractKey(chainId)))
  if (!storedContracts) {
    return null
  }
  return storedContracts
}
