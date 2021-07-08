import { getPodContractAddresses } from '@pooltogether/api-runner'

import { log } from '../../utils/sentry'
import { getPodsKey } from '../../utils/kvKeys'

/**
 * Call getPools and store the response in cloudflares KV
 * @param {*} event
 * @param {*} chainId The chain id to refresh pods on
 * @param {*} podAddresses The the pod addresses to update
 * @returns
 */
export const updatePods = async (event, chainId, podAddresses) => {
  const formattedAddresses = podAddresses.map((address) => address.toLowerCase())

  // Fetch all pods
  const responses = await Promise.allSettled(
    formattedAddresses.map((podAddress) => getPodContractAddresses(Number(CHAIN_ID), podAddress))
  )

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
    throw new Error('No pods fetched during update')
  }

  let storedPods
  try {
    storedPods = (await CONTRACT_ADDRESSES.get(getPodsKey(chainId))) || {}
    storedPods = JSON.parse(storedPods)
  } catch (e) {
    console.warn('No Pods found in KV')
    storedPods = {}
  }

  // Add newly fetched pods to store
  const updatedPods = {
    ...storedPods
  }

  pods.map((pod) => (updatedPods[pod.address] = pod))

  event.waitUntil(
    CONTRACT_ADDRESSES.put(getPodsKey(chainId), JSON.stringify(updatedPods), {
      metadata: {
        lastUpdated: new Date(Date.now()).toUTCString()
      }
    })
  )

  return true
}
