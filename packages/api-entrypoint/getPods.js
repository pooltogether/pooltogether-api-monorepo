import { getPodsKey } from '../../utils/kvKeys'
import { formatPod } from './getPod'

export const getPods = async (event, request) => {
  const _url = new URL(request.url)
  const pathname = _url.pathname.split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)

  let podAddresses = _url.searchParams.get('addresses')?.split(',')

  const storedPods = JSON.parse(await PODS.get(getPodsKey(chainId)))
  const storedPools = JSON.parse(await POOLS.get(getPodsKey(chainId)))

  const pods = podAddresses.map((podAddress) => {
    const pod = storedPods.find((pod) => pod.address === podAddress)
    if (!pod) {
      throw new Error('Pod not found')
    }

    const pool = storedPools.find((pool) => pool.prizePool.address === pod.prizePool)
    if (!pool) {
      throw new Error('Pool not found')
    }

    return formatPod(pod, pool)
  })

  return pods
}
