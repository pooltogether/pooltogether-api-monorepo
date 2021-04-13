const { encodeData, decodeData, prepareTransaction } = require('@pooltogether/etherplex')
// const fetch = require('node-fetch')

export const batch = async (...batchCalls) => {
  const chainId = 1
  // var INFURA_API_ID = process.env.INFURA_ID;

  console.log('batchCalls')
  console.log(batchCalls)
  // console.log(JSON.stringify(batchCalls))

  // TODO: currently we assume any PoolTogether pool is on a network which supports multicall
  // so make sure to handle calls differently if the network doesn't support multicall!
  // (see Etherplex for calls fallback for non-multicall networks)
  const [result, calls, data] = encodeData(batchCalls)
  console.log('result, calls, data')
  console.log(result)
  console.log(calls)
  console.log(data)

  const tx = {
    params: [await prepareTransaction(chainId, data), 'latest'],
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_call'
  }
  console.log('tx')
  console.log(tx)

  const callResponse = await fetch(
    'https://mainnet.infura.io/v3/a0a574aaa9fc4fa8ad117dc7bc6ffc19',
    {
      method: 'POST',
      body: JSON.stringify(tx),
      headers: { 'Content-Type': 'application/json' }
    }
  )
  console.log('callResponse')
  console.log(callResponse)
  const body = await callResponse.json()
  console.log('body')
  console.log(body)
  const decoded = decodeData(result, calls, body.result)

  console.log('decoded')
  console.log(decoded)
  console.log(JSON.stringify(decoded))

  return decoded
}
