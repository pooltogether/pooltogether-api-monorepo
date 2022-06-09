import cheerio from 'cheerio'

import { log } from '../../utils/sentry'
import { getGasKey } from '../../utils/kvKeys'
import { getGasChainIdMapping } from '../../utils/getGasChainIdMapping'
import { AVALANCHE_CHAIN_ID, MAINNET_CHAIN_ID, OPTIMISM_CHAIN_ID, POLYGON_CHAIN_ID } from './index'
import { ethers } from 'ethers'

// Confirmation time!
// `https://api.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=2000000000&apiKey=${ETHERSCAN_API_KEY}`

/**
 * Get latest gas cost for chain and store the response in cloudflares KV
 * @param {*} event
 * @param {*} chainId The chain id to refresh gas costs for
 * @returns
 */
export const updateGasCosts = async (event, chainId) => {
  let gasCosts

  const mappedChainId = getGasChainIdMapping(chainId)

  gasCosts = await getGasCosts(mappedChainId)

  if (!gasCosts) {
    event.waitUntil(log(new Error('No gas costs fetched during update'), event.request))
    throw new Error('gasCosts was not set')
  } else {
    event.waitUntil(GAS.put(getGasKey(chainId), JSON.stringify(gasCosts)), {
      metadata: {
        lastUpdated: new Date(Date.now()).toUTCString()
      }
    })
    event.waitUntil(GAS.put(`${chainId} - Last updated`, new Date(Date.now()).toUTCString()))
  }
}

const getGasCosts = async (chainId) => {
  if (chainId === MAINNET_CHAIN_ID) {
    return await getEthereumGasCosts()
  } else if (chainId === POLYGON_CHAIN_ID) {
    return await getPolygonGasCosts()
  } else if (chainId === AVALANCHE_CHAIN_ID) {
    return await getAvalancheGasCosts()
  } else if (chainId === OPTIMISM_CHAIN_ID) {
    return await getOptimismGasCosts()
  } else {
    return null
  }
}

// Fetch the latest gas costs from etherscan API for mainnet ethereum
const getEthereumGasCosts = async () => {
  const response = await fetch(
    `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apiKey=${ETHERSCAN_API_KEY}`
  )
  const data = await response.json()
  return {
    result: {
      SafeGasPrice: data.result.SafeGasPrice,
      ProposeGasPrice: data.result.ProposeGasPrice,
      FastGasPrice: data.result.FastGasPrice
    }
  }
}

// For networks that don't have an API, we scrape the gas costs from their "etherscan" gastracker html page (no API)
const getPolygonGasCosts = async () => scrapeEtherscan(`https://polygonscan.com/gastracker`)
const getAvalancheGasCosts = async () => scrapeEtherscan(`https://snowtrace.io/gastracker`)

const scrapeEtherscan = async (etherscanUrl) => {
  const response = await fetch(etherscanUrl)
  const body = await response.text()

  const $ = cheerio.load(body)
  const standard = $('span#standardgas')
    .text()
    .split(' ')[0]
  const fast = $('span#fastgas')
    .text()
    .split(' ')[0]
  const rapid = $('span#rapidgas')
    .text()
    .split(' ')[0]

  const result = {
    result: {
      SafeGasPrice: standard,
      ProposeGasPrice: fast,
      FastGasPrice: rapid
    }
  }

  return result
}

/**
 * NOTE: No difference between safe, propose and fast. optimistic etherscan doesn't have the page to scrape.
 * @returns
 */
const getOptimismGasCosts = async () => {
  const url = `https://optimism-mainnet.infura.io/v3/${INFURA_ID}`
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', method: 'rollup_gasPrices', params: [], id: 1 })
  })
  const data = await response.json()
  const l1Price = ethers.utils.parseUnits(Number(data.result.l1GasPrice).toString(), '9')
  const l2Price = ethers.utils.parseUnits(Number(data.result.l2GasPrice).toString(), '9')
  const totalPrice = ethers.utils.formatUnits(l1Price.add(l2Price), '18')

  const result = {
    result: {
      SafeGasPrice: totalPrice,
      ProposeGasPrice: totalPrice,
      FastGasPrice: totalPrice
    }
  }

  return result
}
