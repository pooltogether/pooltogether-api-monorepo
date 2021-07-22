<<<<<<< HEAD
import { setInfuraId, setFetch } from '@pooltogether/api-runner'
=======
import { setInfuraId } from '@pooltogether/api-runner'

>>>>>>> 435d45b651b0c1d62d7e11cccdc462bea0d0d690
import { DEFAULT_HEADERS } from '../../utils/constants'
import { log } from '../../utils/sentry'
import { updatePools } from './updatePools'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

addEventListener('scheduled', (event) => {
  try {
    event.waitUntil(updatePoolsScheduledHandler(event))
  } catch (e) {
    event.waitUntil(log(e, event.request))
  }
})

/**
 * Handle cloudflare cron job triggers by updating pools
 * @param {*} event
 * @returns
 */
async function updatePoolsScheduledHandler(event) {
  setInfuraId(INFURA_ID)
  setFetch(fetch)
  try {
    await updatePools(event, Number(CHAIN_ID))
    return true
  } catch (e) {
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

    // Read routes
    if (pathname.startsWith(`/update`)) {
      try {
        await updatePools(event, Number(CHAIN_ID))
        const successResponse = new Response(`Successfully updated ${CHAIN_ID}`, {
          ...DEFAULT_HEADERS,
          status: 200
        })
        successResponse.headers.set('Content-Type', 'text/plain')
        return successResponse
      } catch (e) {
        event.waitUntil(log(e, e.request))
        const errorResponse = new Response(`Error updating ${CHAIN_ID}`, {
          ...DEFAULT_HEADERS,
          status: 500
        })
        errorResponse.headers.set('Content-Type', 'text/plain')
        return errorResponse
      }
    }

    const notFoundResponse = new Response('Invalid request', {
      ...DEFAULT_HEADERS,
      status: 500
    })
    notFoundResponse.headers.set('Content-Type', 'text/plain')
    return notFoundResponse
  } catch (e) {
    event.waitUntil(log(e, e.request))

    const errorResponse = new Response('Error', {
      ...DEFAULT_HEADERS,
      status: 500
    })
    errorResponse.headers.set('Content-Type', 'text/plain')
    return errorResponse
  }
}
