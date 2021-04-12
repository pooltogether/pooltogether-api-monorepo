/**
  Retrieves a new provider specific to read.  The reason we separate the read and the writes is that the
  web3 providers on mobile dapps are extremely buggy; it's better to read the network through an INFURA
  JsonRpc endpoint.

  This function will first check to see if there is an injected web3.  If web3 is being injected, then a
  Ethers Web3Provider is instantiated to check the network.  Once the network is determined the Ethers
  getDefaultProvider function is used to create a provider pointing to the same network using an Infura node.
*/
import { ethers, getDefaultProvider } from 'ethers'
import { getChain } from '@pooltogether/evm-chains-extended'

import { ETHEREUM_NETWORKS } from 'lib/constants'

const providerCache = {}

const INFURA_API_ID = process.env.INFURA_ID

export const readProvider = async function (chainId) {
  // return getDefaultProvider()

  console.log(process.env)
  console.log(process.env.INFURA_ID)
  console.log(INFURA_API_ID)
  let p
  try {
    p = new ethers.providers.CloudflareProvider()
    console.log(JSON.stringify(p))
  } catch (e) {
    console.log(e.message)
  }
  return p

  // const prov = new ethers.providers.InfuraProvider(chainId, '5e378f49a3994737940a897b2d95222b')
  // console.log(JSON.stringify(prov))
  // return prov

  // try {
  //   if (chainId) {
  //     const network = getChain(chainId)
  //     const jsonRpcProviderUrl = network.rpc?.[0]

  //     if (network && ETHEREUM_NETWORKS.includes(chainId)) {
  //       provider = ethers.getDefaultProvider(network.network)
  //       // provider = ethers.getDefaultProvider(networkName === 'mainnet' ? 'homestead' : networkName)
  //     } else if (chainId === 1234 || chainId === 31337) {
  //       provider = new ethers.providers.JsonRpcProvider()
  //     } else {
  //       provider = new ethers.providers.JsonRpcProvider(jsonRpcProviderUrl)
  //     }

  //     const net = await provider.getNetwork()

  //     // If we're running against an Ethereum network
  //     if (net && net.name !== 'unknown') {
  //       if (!providerCache[net.name]) {
  //         providerCache[net.name] = new ethers.providers.InfuraProvider(
  //           net.name,
  //           INFURA_API_ID
  //         )
  //       }

  //       // use a separate Infura-based provider for consistent read api
  //       provider = providerCache[net.name]
  //     }
  //   }
  // } catch (e) {
  //   console.error(e)
  // }

  // return provider
}
