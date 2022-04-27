import { isAddress } from 'ethers/lib/utils'

/**
 * Returns related contract addresses stored in the KV
 * @param {*} chainId
 * @param {*} rootContractAddress
 * @param {*} getRootContractKey
 * @returns
 */
export const getRootContractAddresses = async (
  chainId,
  rootContractAddress,
  getRootContractKey
) => {
  if (!isAddress(rootContractAddress)) return null

  const storedContracts = JSON.parse(await CONTRACT_ADDRESSES.get(getRootContractKey(chainId)))
  if (!storedContracts) return null

  const contractAddresses = storedContracts.find(
    (contract) => contract.metadata.address === rootContractAddress
  )
  if (!contractAddresses) return null
  return contractAddresses
}
