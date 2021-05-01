import { gql } from 'graphql-request'

import { CUSTOM_CONTRACT_ADDRESSES } from 'lib/constants'
import { getUniswapSubgraphClient } from 'lib/hooks/useSubgraphClients'

const KNOWN_STABLECOIN_ADDRESSES = {
  137: ['0xc2132d05d31c914a87c6611c10748aeb04b58e8f', '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063']
}

const QUERY_TEMPLATE = `token__num__: tokens(where: { id: "__address__" } __blockFilter__) {
  id
  derivedETH
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

const _calculateUsd = (token) => {
  let derivedETH = token?.derivedETH

  if (!derivedETH || derivedETH === '0') {
    derivedETH = 0.2 // 1 ETH is $5 USD, used for Rinkeby, etc
  }

  return 1 / derivedETH
}

export const getTokenPriceData = async (chainId, addresses, fetch, blockNumber = -1) => {
  // On polygon return mock data from last successful request
  if (chainId === 137) {
    return {
      '0x9ecb26631098973834925eb453de1908ea4bdd4e': undefined,
      '0x85e16156eb86a134ac6db5754be6c5e1c7f1aa59': undefined,
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': {
        derivedETH: '0.0002738011536430973713419631510944318',
        id: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        usd: 0.0013690057682154868
      },
      'ethereum': { derivedETH: '1', id: 'eth', usd: 5 },
      '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { usd: 1 },
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { usd: 1 }
    }
  }

  // Only supported on mainnet
  if (chainId !== 1) {
    return {}
  }

  const knownStablecoinAddresses = KNOWN_STABLECOIN_ADDRESSES?.[chainId] || []

  const blockFilter = _getBlockFilter(blockNumber)
  const graphQLClient = getUniswapSubgraphClient(chainId, fetch)

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

    const selection = QUERY_TEMPLATE.replace('__num__', i)
      .replace('__address__', address)
      .replace('__blockFilter__', blockFilter)

    query = `${query}\n${selection}`
  }

  console.log('getting token prices from the graph ...')
  console.log('getting token prices from the graph ...')
  const response = query
    ? await graphQLClient.request(gql`query uniswapTokensQuery { ${query} }`)
    : {}
  console.log('got token prices from graph')

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
    usd: _calculateUsd(data[stablecoinAddress])
  }

  // calculate the price of the token in USD
  for (let i = 0; i < filteredAddresses.length; i++) {
    const address = filteredAddresses[i]
    const token = data[address]

    if (token) {
      data[address] = {
        ...token,
        usd: data['ethereum'].usd * parseFloat(token.derivedETH)
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
