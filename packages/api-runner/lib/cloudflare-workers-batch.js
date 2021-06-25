import { encodeData, decodeData, prepareTransaction } from '@pooltogether/etherplex'

const RPC_URLS = {
  1: 'https://mainnet.infura.io/v3/a0a574aaa9fc4fa8ad117dc7bc6ffc19', // TODO: lock this app ID down
  4: 'https://rinkeby.infura.io/v3/a0a574aaa9fc4fa8ad117dc7bc6ffc19',
  137: 'https://polygon-mainnet.infura.io/v3/a0a574aaa9fc4fa8ad117dc7bc6ffc19',
  80001: 'https://polygon-mumbai.infura.io/v3/a0a574aaa9fc4fa8ad117dc7bc6ffc19'
}

export const batch = async (chainId, fetch, ...batchCalls) => {
  // TODO: currently we assume any PoolTogether pool is on a network which supports multicall
  // so make sure to handle calls differently if the network doesn't support multicall!
  // (see Etherplex for calls fallback for non-multicall networks)
  const [result, calls, data] = encodeData(...batchCalls)

  const tx = {
    params: [await prepareTransaction(chainId, data), 'latest'],
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_call'
  }

  let callResponse
  // console.log(RPC_URLS[chainId])
  // console.log('getting matic')
  try {
    callResponse = await fetch(RPC_URLS[Number(chainId)], {
      method: 'POST',
      body: JSON.stringify(tx),
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.log(e.message)
  }

  const body = await callResponse.json()
  // console.log('matic response')
  const decoded = decodeData(result, calls, body.result)

  return decoded
}
