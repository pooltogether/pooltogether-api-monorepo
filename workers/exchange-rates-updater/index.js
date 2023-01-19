import { log } from '../../utils/sentry'
import { DEFAULT_HEADERS } from '../../utils/constants'
import { getCurrentDateString } from '../../utils/getCurrentDateString'
import { getExchangeRate } from './getExchangeRate'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

addEventListener('scheduled', (event) => {
  event.waitUntil(handleSchedule(event))
})

/**
 * Respond with requested yield source
 * @param {Event} event
 */
async function handleRequest(event) {
  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname

    if (pathname.startsWith(`/update`)) {
      try {
        await handleSchedule(event)
        const successResponse = new Response('Successfully updated', {
          ...DEFAULT_HEADERS,
          status: 200
        })
        successResponse.headers.set('Content-Type', 'text/plain')
        return successResponse
      } catch (e) {
        event.waitUntil(log(e, e.request))
        const errorResponse = new Response('Error updating', {
          ...DEFAULT_HEADERS,
          status: 500
        })
        errorResponse.headers.set('Content-Type', 'text/plain')
        return errorResponse
      }
    }



    const notFoundResponse = new Response('Invalid route', {
      ...DEFAULT_HEADERS,
      status: 404
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

/**
 * Refetch yield source data and update in KV
 * @param {Event} event
 */
async function handleSchedule(event) {
  try {
    const storedData = JSON.parse(await EXCHANGE_RATES.get('data'))
    const data = await getExchangeRate(event)

    // TODO: Error handling. Don't overwrite if there's an error.

    await EXCHANGE_RATES.put('data', JSON.stringify(data), {
      metadata: { lastUpdated: getCurrentDateString() }
    })
  } catch (e) {
    event.waitUntil(log(e, event.request))
  }
}

