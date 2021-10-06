import { gql } from 'graphql-request'

import { CUSTOM_CONTRACT_ADDRESSES } from 'lib/constants'
import { getNativeCurrencyKey, getUniswapSubgraphClient } from 'lib/hooks/useSubgraphClients'

import { fetch } from '../../index'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

const KNOWN_STABLECOIN_ADDRESSES = {
  137: [
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
  ]
}

const ETHEREUM_MAINNET_CHAIN_ID = 1
const ETHEREUM_MAINNET_MATIC_ADDRESS = '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
const ETHEREUM_MAINNET_POOL_ADDRESS = '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e'

const ETHEREUM_MAINNET_SOHM_ADDRESS = '0x04f2694c8fcee23e8fd0dfea1d4f5bb8c352111f'

const POLYGON_WMATIC_TOKEN_ADDRESS = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
const POLYGON_POOL_TOKEN_ADDRESS = '0x25788a1a171ec66da6502f9975a15b609ff54cf6'

const CELO_CEUR_ADDRESS = '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73'

// prices as fallback:
const HARD_CODED_CELU_EUR_PRICE = 1.17
const HARD_CODED_OHM_PRICE = 874.23
const HARD_CODED_MATIC_PRICE = 1.471103
const HARD_CODED_POOL_PRICE = 12.24

export const getTokenPriceData = async (chainId, addresses, blockNumber = -1) => {
  // On polygon return mock data from last successful request and the price of MATIC (WMATIC) on the Ethereum network
  // (basically the same price as on Polygon or anywhere else)
  if (chainId === 137) {
    return await ethereumMainnetTokenPriceData()
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
    let address = filteredAddresses[i]
    let token = data[address]

    if (!token && address?.toLowerCase() === ETHEREUM_MAINNET_SOHM_ADDRESS.toLowerCase()) {
      token = {
        id: ETHEREUM_MAINNET_SOHM_ADDRESS.toLowerCase(),
        derivedETH: 0,
        usd: 0
      }
    }

    if (token) {
      let usdFromCoingecko
      if (address.toLowerCase() === CELO_CEUR_ADDRESS.toLowerCase()) {
        usdFromCoingecko = await getCoingeckoTokenDataByTokenId('celo-euro')
        if (!usdFromCoingecko) {
          usdFromCoingecko = HARD_CODED_CELU_EUR_PRICE
        }
      }

      if (address.toLowerCase() === ETHEREUM_MAINNET_SOHM_ADDRESS.toLowerCase()) {
        usdFromCoingecko = await getCoingeckoTokenDataByTokenId('olympus')
        if (!usdFromCoingecko) {
          usdFromCoingecko = HARD_CODED_OHM_PRICE
        }
        address = ETHEREUM_MAINNET_SOHM_ADDRESS.toLowerCase()
      }

      data[address] = {
        ...token,
        derivedETH: token[getNativeCurrencyKey(chainId)],
        usd: usdFromCoingecko
          ? usdFromCoingecko
          : data['ethereum'].usd * parseFloat(token[getNativeCurrencyKey(chainId)])
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

const ethereumMainnetTokenPriceData = async () => {
  const maticPriceOnEthereumData = await getTokenPriceData(ETHEREUM_MAINNET_CHAIN_ID, [
    ETHEREUM_MAINNET_MATIC_ADDRESS
  ])
  const poolPriceOnEthereumData = await getTokenPriceData(ETHEREUM_MAINNET_CHAIN_ID, [
    ETHEREUM_MAINNET_POOL_ADDRESS
  ])

  return {
    '0x9ecb26631098973834925eb453de1908ea4bdd4e': undefined,
    '0x85e16156eb86a134ac6db5754be6c5e1c7f1aa59': undefined,
    [POLYGON_WMATIC_TOKEN_ADDRESS]: {
      derivedETH: '0.0006555576548927038397327620248452385',
      id: POLYGON_WMATIC_TOKEN_ADDRESS,
      usd: maticPriceOnEthereumData?.[ETHEREUM_MAINNET_MATIC_ADDRESS]?.usd || HARD_CODED_MATIC_PRICE
    },
    [POLYGON_POOL_TOKEN_ADDRESS]: {
      derivedETH: '0.006555576548927038397327620248452385',
      id: POLYGON_POOL_TOKEN_ADDRESS,
      usd: poolPriceOnEthereumData?.[ETHEREUM_MAINNET_POOL_ADDRESS]?.usd || HARD_CODED_POOL_PRICE
    },
    'ethereum': { derivedETH: '1', id: 'eth', usd: 5 },
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { usd: 1 },
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { usd: 1 },
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { usd: 1 }
  }
}

const getCoingeckoTokenDataByTokenId = async (coinId) => {
  try {
    const response = await fetch(`${COINGECKO_API_URL}/coins/${coinId}`)
    const json = await response.json()
    return json.market_data.current_price.usd
  } catch (e) {
    console.warn(e.message)
    return undefined
  }
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
