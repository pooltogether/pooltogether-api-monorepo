import { log } from '../../utils/sentry'
import { getCachedResponse } from '../../utils/getCachedResponse'
import { DEFAULT_HEADERS } from '../../utils/constants'
import { getCurrentDateString } from '../../utils/getCurrentDateString'
import { getPool } from './getPool'
import { getPools } from './getPools'
import { getPod } from './getPod'
import { getPods } from './getPods'

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

    const singlePoolRegex = /\/pools\/[\d]*\/[A-Za-z0-9]*/
    const multiPoolRegex = /\/pools\/[\d]*/
    const singlePodRegex = /\/pods\/[\d]*\/[A-Za-z0-9]*/
    const multiPodRegex = /\/pods\/[\d]*/

    // Read routes
    if (singlePoolRegex.test(pathname)) {
      return getCachedResponse(event, getPool(event, request), 5)
    } else if (multiPoolRegex.test(pathname)) {
      return getCachedResponse(event, getPools(event, request), 5)
    } else if (singlePodRegex.test(pathname)) {
      return getCachedResponse(event, getPod(event, request), 5)
    } else if (multiPodRegex.test(pathname)) {
      return getCachedResponse(event, getPods(event, request), 5)
    }

    const errorMsg = `Hello :) Please use one of the following paths:\n\nAll pools:     /pools/:chainId.json\nSpecific pool: /pools/:chainId/:poolAddress\n\nExample: /pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a`
    const invalidRequestResponse = new Response(errorMsg, {
      ...DEFAULT_HEADERS,
      status: 500
    })
    invalidRequestResponse.headers.set('Content-Type', 'text/plain')
    return invalidRequestResponse
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
    const storedData = JSON.parse(await YIELD_SOURCE.get('data'))

    const data = {}
    const aaveResponse = await getAave(event)
    const compoundResponse = await getCompound(event)

    // Update values if possible
    data[YIELD_SOURCES.aave] = aaveResponse ? aaveResponse : storedData[YIELD_SOURCES.aave]
    data[YIELD_SOURCES.compound] = compoundResponse
      ? compoundResponse
      : storedData[YIELD_SOURCES.compound]

    await YIELD_SOURCE.put('data', JSON.stringify(data), {
      metadata: { lastUpdated: getCurrentDateString() }
    })
  } catch (e) {
    event.waitUntil(log(e, event.request))
  }
}
