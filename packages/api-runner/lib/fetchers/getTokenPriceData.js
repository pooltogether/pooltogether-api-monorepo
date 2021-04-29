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
