import { log } from '../../utils/sentry'
import { DEFAULT_HEADERS } from '../../utils/constants'
import { getCurrentDateString } from '../../utils/getCurrentDateString'
import { getCachedResponse } from '../../utils/getCachedResponse'
import { getAave } from './getAave'
import { getCompound } from './getCompound'
import { YIELD_SOURCES } from '../../utils/constants'
import { getCream } from './getCream'

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

    // Read routes
    if (pathname.startsWith(`/${YIELD_SOURCES.aave}`)) {
      return getCachedResponse(event, getYieldSourceData(YIELD_SOURCES.aave))
    } else if (pathname.startsWith(`/${YIELD_SOURCES.compound}`)) {
      return getCachedResponse(event, getYieldSourceData(YIELD_SOURCES.compound))
    } else if (pathname.startsWith(`/${YIELD_SOURCES.cream}`)) {
      return getCachedResponse(event, getYieldSourceData(YIELD_SOURCES.cream))
      // Manual update
    } else if (pathname.startsWith(`/update`)) {
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

    const notFoundResponse = new Response('Yield source not found', {
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

async function getYieldSourceData(yieldSource) {
  const storedData = JSON.parse(await YIELD_SOURCE.get('data'))
  return storedData[yieldSource]
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
    const creamResponse = await getCream(event)

    // Update values if possible
    data[YIELD_SOURCES.cream] = getNewValue(creamResponse, storedData, YIELD_SOURCES.cream)
    data[YIELD_SOURCES.aave] = getNewValue(aaveResponse, storedData, YIELD_SOURCES.aave)
    data[YIELD_SOURCES.compound] = getNewValue(compoundResponse, storedData, YIELD_SOURCES.compound)

    await YIELD_SOURCE.put('data', JSON.stringify(data), {
      metadata: { lastUpdated: getCurrentDateString() }
    })
  } catch (e) {
    event.waitUntil(log(e, event.request))
  }
}

const getNewValue = (response, storedData, key) => (response ? response : storedData[key])
