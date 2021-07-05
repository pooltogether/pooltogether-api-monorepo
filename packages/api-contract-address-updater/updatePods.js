import { getPodContractAddresses } from '@pooltogether/api-runner'
import { ethers } from 'ethers'

import { log } from '../../utils/sentry'
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
  // Check for valid addresses
  podAddresses = podAddresses.map((podAddress) => {
    const address = podAddress.toLowerCase()
    if (!ethers.utils.isAddress(address)) {
      throw new Error(`${address} is not a valid address`)
    }
    return address
  })

  // Fetch all pods
  const responses = await Promise.allSettled(
    podAddresses.map((podAddress) => getPodContractAddresses(Number(CHAIN_ID), podAddress))
  )

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
