import { ethers } from 'ethers'

const POLYGON_INFURA_WEBSOCKETS_URL = `wss://polygon-mainnet.infura.io/ws/v3`
const BINANCE_QUICKNODE_WEBSOCKETS_URL = `wss://red-fragrant-fire.bsc.quiknode.pro`

export const getProviders = (chainIds) => {
  const providers = {}
  chainIds.forEach((chainId) => {
    providers[chainId] = getProvider(chainId)
  })
  return providers
}

export const getProvider = (chainId) => {
  if ([1, 4].includes(chainId)) {
    return new ethers.providers.InfuraProvider(chainId, INFURA_ID)
  } else if (chainId === 137) {
    return new ethers.providers.JsonRpcProvider(
      `${POLYGON_INFURA_WEBSOCKETS_URL}/${INFURA_ID}`,
      137
    )
  } else if (chainId === 80001) {
    return new ethers.providers.JsonRpcProvider('https://matic-mumbai.chainstacklabs.com', 80001)
  } else {
    throw new Error('Unsupported chain id')
  }
}
