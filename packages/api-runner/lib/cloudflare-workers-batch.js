import { encodeData, decodeData, prepareTransaction } from '@pooltogether/etherplex'
import { fetch, INFURA_ID } from '../index'

const getRpcUrl = (chainId) => {
  switch (chainId) {
    case 1:
      return `https://mainnet.infura.io/v3/${INFURA_ID}`
    case 4:
      return `https://rinkeby.infura.io/v3/${INFURA_ID}`
    case 137:
      return `https://polygon-mainnet.infura.io/v3/${INFURA_ID}`
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
    params: [await prepareTransaction(chainId, data), 'latest'],
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_call'
  }

  let callResponse
  // console.log('getting matic')

  console.log(JSON.stringify(podContract))

  callResponse = await fetch(getRpcUrl(Number(chainId)), {
    method: 'POST',
    body: JSON.stringify(tx),
    headers: { 'Content-Type': 'application/json' }
  })

  const body = await callResponse.json()
  // console.log('matic response')
  const decoded = decodeData(result, calls, body.result)

  return decoded
}
