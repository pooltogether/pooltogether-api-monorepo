import { ethers } from 'ethers'

export const validateAddresses = (addresses) => {
  return addresses.map((addresses) => {
    const address = addresses.toLowerCase()
    if (!ethers.utils.isAddress(address)) {
      throw new Error(`${address} is not a valid address`)
    }
    return address
  })
}
