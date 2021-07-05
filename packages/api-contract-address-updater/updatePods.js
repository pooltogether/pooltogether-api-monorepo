import { log } from '../../utils/sentry'
import { getPodContractAddresses } from '@pooltogether/api-runner'
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

  console.log(podAddresses)

  // Fetch all pods
  const responses = await Promise.allSettled(
    podAddresses.map((podAddress) => getPodContractAddresses(Number(CHAIN_ID), podAddress))
  )

  console.log('Responses', JSON.stringify(responses))

  const pods = []
  responses.map((response) => {
    const { status, value, reason } = response
    if (status === 'rejected') {
      console.log(reason)
      event.waitUntil(log(new Error(reason, event.request)))
    } else {
      pods.push(value)
    }
  })

  if (!pods || pods.length === 0) {
    throw new Error('No pods fetched during update')
  }

  let storedPods
  try {
    storedPods = JSON.parse(await CONTRACT_ADDRESSES.get(getPodsKey(chainId)))
  } catch (e) {
    console.warn('No Pods found in KV')
    storedPods = {}
  }

  // Add newly fetched pods to store
  pods.map((pod) => (storedPods[pod.address] = pod))

  console.log(
    'Put',
    JSON.stringify(CONTRACT_ADDRESSES),
    JSON.stringify(storedPods),
    JSON.stringify(pods),
    JSON.stringify(responses)
  )
  event.waitUntil(CONTRACT_ADDRESSES.put(getPodsKey(chainId)), JSON.stringify(storedPods), {
    metadata: {
      lastUpdated: new Date(Date.now()).toUTCString()
    }
  })

  return true
}
