import { log } from '../../utils/sentry'
import { getGasKey } from '../../utils/kvKeys'

// Confirmation time!
// `https://api.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=2000000000&apiKey=${ETHERSCAN_API_KEY}`

/**
 * Get latest gas cost for chain and store the response in cloudflares KV
 * @param {*} event
 * @param {*} chainId The chain id to refresh gas costs for
 * @returns
 */
export const updateGasCosts = async (event, chainId, forceUpdate = false) => {
  const response = await fetch(
    `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apiKey=${ETHERSCAN_API_KEY}`
  )

  console.log(response)
  // ETHERSCAN_API_KEY
  //api.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=2000000000&apikey=YourApiKeyToken
  const gasCosts = await response.json()
  console.log(gasCosts)

  if (!gasCosts) {
    event.waitUntil(log(new Error('No gas costs fetched during update'), event.request))
    return false
  } else {
    event.waitUntil(GAS.put(getGasKey(chainId), JSON.stringify(gasCosts)), {
      metadata: {
        lastUpdated: new Date(Date.now()).toUTCString()
      }
    })
    event.waitUntil(GAS.put(`${chainId} - Last updated`, new Date(Date.now()).toUTCString()))
  }
}
