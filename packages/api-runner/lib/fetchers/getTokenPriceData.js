import { gql } from 'graphql-request'

import { CUSTOM_CONTRACT_ADDRESSES } from 'lib/constants'
import { getNativeCurrencyKey, getUniswapSubgraphClient } from 'lib/hooks/useSubgraphClients'

const KNOWN_STABLECOIN_ADDRESSES = {
  137: [
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
  ]
}

const getQueryTemplate = (
  chainId
) => `token__num__: tokens(where: { id: "__address__" } __blockFilter__) {
  id
  ${getNativeCurrencyKey(chainId)}
}`

const _addStablecoin = (addresses, stableCoinAddress) => {
  const stableCoin = addresses.find((address) => stableCoinAddress === address)

  if (!stableCoin) {
    addresses.splice(0, 0, stableCoinAddress)
  }

  return addresses
}

const _getBlockFilter = (blockNumber) => {
  let blockFilter = ''

  if (blockNumber > 0) {
    blockFilter = `, block: { number: ${blockNumber} }`
  }

  return blockFilter
}

const _calculateUsd = (token, chainId) => {
  let derivedETH = token?.[getNativeCurrencyKey(chainId)]

  if (!derivedETH || derivedETH === '0') {
    derivedETH = 0.2 // 1 ETH is $5 USD, used for Rinkeby, etc
  }

  return 1 / derivedETH
}

const ETHEREUM_MAINNET_CHAIN_ID = 1
const ETHEREUM_MAINNET_MATIC_ADDRESS = '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
// MATIC price as of July 15th, 2021 as fallback:
const HARD_CODED_MATIC_PRICE = 0.871103

export const getTokenPriceData = async (chainId, addresses, blockNumber = -1) => {
  // On polygon return mock data from last successful request and the price of MATIC (WMATIC) on the Ethereum network
  // (basically the same price as on Polygon or anywhere else)
  if (chainId === 137) {
    return await maticTokenPriceData()
  }

  const knownStablecoinAddresses = KNOWN_STABLECOIN_ADDRESSES?.[chainId] || []

  const blockFilter = _getBlockFilter(blockNumber)
  const graphQLClient = getUniswapSubgraphClient(chainId)

  if (!graphQLClient) return null

  // We'll use this stablecoin to measure the price of ETH off of
  const stablecoinAddress = CUSTOM_CONTRACT_ADDRESSES[chainId]?.['Stablecoin']

  _addStablecoin(addresses, stablecoinAddress)

  const stablecoinAddresses = addresses.filter((address) =>
    knownStablecoinAddresses.includes(address)
  )
  const filteredAddresses = addresses.filter(
    (address) => !knownStablecoinAddresses.includes(address)
  )

  // build a query selection set from all the token addresses
  let query = ``
  for (let i = 0; i < filteredAddresses.length; i++) {
    const address = filteredAddresses[i]

    const selection = getQueryTemplate(chainId)
      .replace('__num__', i)
      .replace('__address__', address)
      .replace('__blockFilter__', blockFilter)

    query = `${query}\n${selection}`
  }

  // console.log('getting token prices from the graph ...')
  const response = query
    ? await graphQLClient.request(gql`query uniswapTokensQuery { ${query} }`)
    : {}
  // console.log('got token prices from graph')

  // unpack the data into a useful object
  let data = {}
  for (let i = 0; i < filteredAddresses.length; i++) {
    const address = filteredAddresses[i]
    const token = response[`token${i}`][0]

    data[address] = token
  }

  // calculate and cache the price of eth in the data object
  data['ethereum'] = {
    derivedETH: '1',
    id: 'eth',
    usd: _calculateUsd(data[stablecoinAddress], chainId)
  }

  // calculate the price of the token in USD
  for (let i = 0; i < filteredAddresses.length; i++) {
    const address = filteredAddresses[i]
    const token = data[address]

    if (token) {
      data[address] = {
        ...token,
        derivedETH: token[getNativeCurrencyKey(chainId)],
        usd: data['ethereum'].usd * parseFloat(token[getNativeCurrencyKey(chainId)])
      }
    }
  }
  stablecoinAddresses.forEach((address) => {
    data[address] = {
      usd: 1
    }
  })

  return data
}

const maticTokenPriceData = async () => {
  const maticPriceOnEthereumData = await getTokenPriceData(ETHEREUM_MAINNET_CHAIN_ID, [
    ETHEREUM_MAINNET_MATIC_ADDRESS
  ])

  return {
    '0x9ecb26631098973834925eb453de1908ea4bdd4e': undefined,
    '0x85e16156eb86a134ac6db5754be6c5e1c7f1aa59': undefined,
    '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': {
      derivedETH: '0.0006555576548927038397327620248452385',
      id: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      usd:
        maticPriceOnEthereumData?.[ETHEREUM_MAINNET_MATIC_ADDRESS]?.usd || HARD_CODED_MATIC_PRICE
    },
    'ethereum': { derivedETH: '1', id: 'eth', usd: 5 },
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { usd: 1 },
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { usd: 1 },
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { usd: 1 }
  }
}