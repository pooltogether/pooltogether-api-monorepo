import { ethers } from 'ethers'

import { getPodsKey, getPoolsKey } from '../../utils/kvKeys'

export const getPod = async (event, request) => {
  const _url = new URL(request.url)
  const pathname = _url.pathname.split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)
  const podAddress = pathname.split('/')[3].toLowerCase()

  if (!ethers.utils.isAddress(podAddress)) {
    throw new Error(`Invalid address ${podAddress}`)
  }

  const storedPods = JSON.parse(await CONTRACT_ADDRESSES.get(getPodsKey(chainId)))
  const storedPools = JSON.parse(await POOLS.get(getPoolsKey(chainId)))

  const pod = storedPods[podAddress]
  if (!pod) {
    throw new Error('Pod not found')
  }

  console.log(podAddress, pod.prizePool, JSON.stringify(storedPools))
  const pool = storedPools.find(
    (pool) => pool.prizePool.address.toLowerCase() === pod.prizePool.toLowerCase()
  )
  if (!pool) {
    throw new Error('Pool not found')
  }

  return formatPod(podAddress, pod, pool)
}

export const formatPod = (podAddress, pod, pool) => {
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
