import {
  encodeData,
  decodeData,
  prepareTransaction,
} from '@pooltogether/etherplex'

const getRpcUrl = (chainId: number) => {
  switch (chainId) {
    case 1:
      return `https://mainnet.infura.io/v3/${INFURA_ID}`
    case 4:
      return `https://rinkeby.infura.io/v3/${INFURA_ID}`
    case 10:
      return `https://optimism-mainnet.infura.io/v3/${INFURA_ID}`
    case 56:
      return 'https://bsc-dataseed.binance.org/'
    case 137:
      return `https://polygon-mainnet.infura.io/v3/${INFURA_ID}`
    case 43113:
      return 'https://api.avax-test.network/ext/bc/C/rpc'
    case 43114:
      return 'https://api.avax.network/ext/bc/C/rpc'
    case 42220:
      return `https://forno.celo.org`
    case 80001:
      return `https://polygon-mumbai.infura.io/v3/${INFURA_ID}`
  }
}

export const batch = async (chainId, ...batchCalls) => {
  // TODO: currently we assume any PoolTogether pool is on a network which supports multicall
  // so make sure to handle calls differently if the network doesn't support multicall!
  // (see Etherplex for calls fallback for non-multicall networks)
  const [result, calls, data] = encodeData(...batchCalls)

  const tx = {
    params: [await prepareTransaction(chainId, data as string), 'latest'],
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_call',
  }

  let callResponse
  callResponse = await fetch(getRpcUrl(Number(chainId)), {
    method: 'POST',
    body: JSON.stringify(tx),
    headers: { 'Content-Type': 'application/json' },
  })

  const body = await callResponse.json()
  const decoded = decodeData(result, calls, body.result)
  return decoded
}
