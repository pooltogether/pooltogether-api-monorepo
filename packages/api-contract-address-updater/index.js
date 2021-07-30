import { setInfuraId, setFetch } from '@pooltogether/api-runner'
import { podContractAddresses } from '@pooltogether/current-pool-data'
import { ethers } from 'ethers'

import { DEFAULT_HEADERS } from '../../utils/constants'
import { log } from '../../utils/sentry'
import { validateAddresses } from '../../utils/validateAddresses'
import { updatePods } from './updatePods'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

addEventListener('scheduled', (event) => {
  try {
    event.waitUntil(updateScheduledHandler(event))
  } catch (e) {
    event.waitUntil(log(e, event.request))
  }
})

/**
 * Handle cloudflare cron job triggers by updating pools
 * @param {*} event
 * @returns
 */
async function updateScheduledHandler(event) {
  setInfuraId(INFURA_ID)
  setFetch(fetch)

  try {
    const podAddresses = podContractAddresses[Number(CHAIN_ID)]
    await updatePods(event, Number(CHAIN_ID), podAddresses)
    return true
  } catch (e) {
    console.log(e)
    event.waitUntil(log(e, event.request))
    return false
  }
}

const PODS_URL = '/pods'

/**
 * Allow manual updates
 * @param {Event} event
 */
async function handleRequest(event) {
  setInfuraId(INFURA_ID)
  setFetch(fetch)

  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname

    // Read routes
    if (pathname.startsWith(PODS_URL)) {
      return podsHandler(event)
    }

    const notFoundResponse = new Response('Invalid request', {
      ...DEFAULT_HEADERS,
      status: 500
    })
    notFoundResponse.headers.set('Content-Type', 'text/plain')
    return notFoundResponse
  } catch (e) {
    console.log(e.message)
    event.waitUntil(log(e, e.request))

    const errorResponse = new Response('Error', {
      ...DEFAULT_HEADERS,
      status: 500
    })
    errorResponse.headers.set('Content-Type', 'text/plain')
    return errorResponse
  }
}

async function podsHandler(event) {
  try {
    const request = event.request
    const url = new URL(request.url)
    const pathname = url.pathname
    // Read routes
    if (pathname.startsWith(`${PODS_URL}/update`)) {
      // TODO: Accept addresses from query params
      // let podAddresses = []
      // try {
      //   podAddresses = url.searchParams.get('addresses').split(',')
      // } catch (e) {
      //   throw new Error('Invalid addresses query parameter')
      // }
      // // Check for valid addresses
      // podAddresses = validateAddresses(podAddresses)

      const podAddresses = podContractAddresses[Number(CHAIN_ID)]

      await updatePods(event, Number(CHAIN_ID), podAddresses)
      const successResponse = new Response(`Successfully updated pods on chain ${CHAIN_ID}`, {
        ...DEFAULT_HEADERS,
        status: 200
      })
      successResponse.headers.set('Content-Type', 'text/plain')
      return successResponse
    }

    throw new Error(`Invalid path ${pathname}`)
  } catch (e) {
    console.log(e.message)
    event.waitUntil(log(e, e.request))
    const errorResponse = new Response(`Error updating pods on chain ${CHAIN_ID}.\n${e.message}`, {
      ...DEFAULT_HEADERS,
      status: 500
    })
    errorResponse.headers.set('Content-Type', 'text/plain')
    return errorResponse
  }
}
