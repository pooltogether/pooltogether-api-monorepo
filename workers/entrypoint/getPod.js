import { ethers } from 'ethers'
import { addTokenTotalUsdValue } from '@pooltogether/utilities'

import { getV3PodsKey, getV3PoolsKey } from '../../utils/kvKeys'

export const getPod = async (event, request) => {
  const _url = new URL(request.url)
  const pathname = _url.pathname.split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)
  const podAddress = pathname.split('/')[3].toLowerCase()

  if (!ethers.utils.isAddress(podAddress)) {
    throw new Error(`Invalid address ${podAddress}`)
  }

  const storedPods = JSON.parse(await CONTRACT_ADDRESSES.get(getV3PodsKey(chainId)))
  const storedPools = JSON.parse(await POOLS.get(getV3PoolsKey(chainId)))

  const pod = storedPods[podAddress]
  if (!pod) {
    throw new Error('Pod not found')
  }

  const pool = storedPools.find(
    (pool) => pool.prizePool.address.toLowerCase() === pod.prizePool.toLowerCase()
  )
  if (!pool) {
    throw new Error('Pool not found')
  }

  return formatPod(chainId, podAddress, pod, pool)
}

export const formatPod = (chainId, podAddress, pod, pool) => {
  const podStablecoin = {
    address: podAddress,
    name: pod.name,
    symbol: pod.symbol,
    decimals: pod.decimals
  }

  addTokenTotalUsdValue(podStablecoin, { [podStablecoin.address]: pool.tokens.ticket })

  return {
    metadata: {
      owner: pod.owner,
      chainId
    },
    faucet: {
      address: pod.faucet
    },
    tokenDrop: {
      address: pod.tokenDrop,
      dripToken: {
        address: pod.tokenDropDripToken
      }
    },
    pod: {
      address: podAddress
    },
    podManager: {
      address: pod.manager
    },
    prize: pool.prize,
    tokens: {
      podStablecoin,
      sponsorship: pool.tokens.sponsorship,
      ticket: pool.tokens.ticket,
      tokenFaucetDripToken: pool.tokens.tokenFaucetDripToken,
      underlyingToken: pool.tokens.underlyingToken
    },
    tokenListener: pool.tokenListener,
    prizePool: pool
  }
}
