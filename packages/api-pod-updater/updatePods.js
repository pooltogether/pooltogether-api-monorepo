import { log } from '../../utils/sentry'
import { getPod } from '@pooltogether/api-runner'
import { getPodsKey } from '../../utils/kvKeys'

/**
 * Call getPools and store the response in cloudflares KV
 * @param {*} event
 * @param {*} chainId The chain id to refresh pools for
 * @returns
 */
export const updatePods = async (event, chainId) => {
  const url = new URL(event.request.url)

  let podAddresses = []
  try {
    podAddresses = url.searchParams.get('addresses').split(',')
  } catch (e) {
    throw new Error('Invalid addresses query parameter')
  }

  // Fetch all pods
  const responses = await Promise.allSettled(podAddresses.map((podAddress) => getPod(podAddresses)))

  const pods = []
  responses.map((response) => {
    const { status, value, reason } = response
    if (status === 'rejected') {
      event.waitUntil(log(new Error(reason, event.request)))
    } else {
      pods.push(value)
    }
  })

  if (!pods || pods.length === 0) {
    event.waitUntil(log(new Error('No pods fetched during update'), event.request))
  }

  event.waitUntil(PODS.put(getPodsKey(chainId)), {
    metadata: {
      lastUpdated: new Date(Date.now()).toUTCString()
    }
  })

  return true
}
