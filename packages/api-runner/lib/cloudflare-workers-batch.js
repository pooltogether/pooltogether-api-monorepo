import { encodeData, decodeData, prepareTransaction } from '@pooltogether/etherplex'

const RPC_URLS = {
  1: 'https://mainnet.infura.io/v3/a0a574aaa9fc4fa8ad117dc7bc6ffc19', // TODO: lock this app ID down
  4: 'https://rinkeby.infura.io/v3/a0a574aaa9fc4fa8ad117dc7bc6ffc19',
  137: 'https://blue-wandering-sunset.matic.quiknode.pro/d42812c1b86a63689c034bda650c4c5daf6eb075/',
  80001: 'https://rpc-mumbai.maticvigil.com/v1/c0d152023d5f8fa74422a77a0cb065e20260380b'
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

  const callResponse = await fetch(RPC_URLS[chainId], {
    method: 'POST',
    body: JSON.stringify(tx),
    headers: { 'Content-Type': 'application/json' }
  })
  const body = await callResponse.json()
  const decoded = decodeData(result, calls, body.result)

  return decoded
}
