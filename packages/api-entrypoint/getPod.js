import { getPodsKey } from '../../utils/kvKeys'

export const getPod = async (event, request) => {
  const _url = new URL(request.url)
  const pathname = _url.pathname.split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)
  const podAddress = pathname.split('/')[3].toLowerCase()

  const storedPods = JSON.parse(await PODS.get(getPodsKey(chainId)))
  const storedPools = JSON.parse(await POOLS.get(getPodsKey(chainId)))

  const pod = storedPods.find((pod) => pod.address === podAddress)
  if (!pod) {
    throw new Error('Pod not found')
  }

  const pool = storedPools.find((pool) => pool.prizePool.address === pod.prizePool)
  if (!pool) {
    throw new Error('Pool not found')
  }

  return formatPod(podAddress, pod, pool)
}

export const formatPod = (pod, pool) => {
  return {
    metadata: {
      owner: pod.owner
    },
    pod: {
      address: podAddress
    },
    podManager: {
      address: pod.manager
    },
    prize: pool.prize,
    tokens: {
      underlyingToken: pool.tokens.underlyingToken,
      podShare: {
        address: pod.ticket,
        name: pod.name,
        symbol: pod.symbol,
        decimals: pod.decimals
      },
      tokenFaucetDripToken: pool.tokens.tokenFaucetDripToken
    },
    tokenFaucet: pool.tokenListener,
    prizePool: pool
  }
}
