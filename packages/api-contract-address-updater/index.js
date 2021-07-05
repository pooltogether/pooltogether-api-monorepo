import { setInfuraId, setFetch } from '@pooltogether/api-runner'
import { DEFAULT_HEADERS } from '../../utils/constants'
import { log } from '../../utils/sentry'
import { updatePods } from './updatePods'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

addEventListener('scheduled', (event) => {
  try {
    event.waitUntil(updatePodsScheduledHandler(event))
  } catch (e) {
    event.waitUntil(log(e, event.request))
  }
})

/**
 * Handle cloudflare cron job triggers by updating pools
 * @param {*} event
 * @returns
 */
async function updatePodsScheduledHandler(event) {
  setInfuraId(INFURA_ID)
  setFetch(fetch)

  try {
    await updatePods(event, Number(CHAIN_ID))
    return true
  } catch (e) {
    console.log(e)
    event.waitUntil(log(e, event.request))
    return false
  }
}

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

    console.log(pathname)

    // Read routes
    if (pathname.startsWith(`/pods`)) {
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
    await updatePods(event, Number(CHAIN_ID))
    const successResponse = new Response(`Successfully updated pods on chain ${CHAIN_ID}`, {
      ...DEFAULT_HEADERS,
      status: 200
    })
    successResponse.headers.set('Content-Type', 'text/plain')
    return successResponse
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
