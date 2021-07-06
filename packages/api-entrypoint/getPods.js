import { ethers } from 'ethers'

import { getPodsKey, getPoolsKey } from '../../utils/kvKeys'
import { formatPod } from './getPod'

export const getPods = async (event, request) => {
  const _url = new URL(request.url)
  const pathname = _url.pathname.split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)

  const addressesQueryParam = _url.searchParams.get('addresses')
  let podAddresses = addressesQueryParam ? addressesQueryParam.split(',') : []
  podAddresses = podAddresses.map((address) => address.toLowerCase())

  podAddresses.map((podAddress) => {
    if (!ethers.utils.isAddress(podAddress)) {
      throw new Error(`Invalid address ${podAddress}`)
    }
  })

  const storedPods = JSON.parse(await CONTRACT_ADDRESSES.get(getPodsKey(chainId)))
  const storedPools = JSON.parse(await POOLS.get(getPoolsKey(chainId)))

  const pods = podAddresses.map((podAddress) => {
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

    return formatPod(podAddress, pod, pool)
  })

  return pods
}
