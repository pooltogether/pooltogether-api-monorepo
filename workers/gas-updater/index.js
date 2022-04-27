import { DEFAULT_HEADERS } from '../../utils/constants'
import { log } from '../../utils/sentry'
import { updateGasCosts } from './updateGasCosts'

export const MAINNET_CHAIN_ID = 1
export const POLYGON_CHAIN_ID = 137
export const AVALANCHE_CHAIN_ID = 43114

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

addEventListener('scheduled', (event) => {
  try {
    event.waitUntil(updateGasScheduledHandler(event))
  } catch (e) {
    event.waitUntil(log(e, event.request))
  }
})

const updateAllGasCosts = async (event) => {
  const mainnetPromise = updateGasCosts(event, MAINNET_CHAIN_ID)
  const polygonPromise = updateGasCosts(event, POLYGON_CHAIN_ID)
  const avalanchePromise = updateGasCosts(event, AVALANCHE_CHAIN_ID)
  return await Promise.all([mainnetPromise, polygonPromise, avalanchePromise])
}

/**
 * Handle cloudflare cron job triggers by updating gas costs
 * @param {*} event
 * @returns
 */
async function updateGasScheduledHandler(event) {
  // setInfuraId(INFURA_ID)
  // setQuicknodeId(QUICKNODE_ID)
  // setFetch(fetch)
  try {
    await updateAllGasCosts(event)
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
  // setInfuraId(INFURA_ID)
  // setQuicknodeId(QUICKNODE_ID)
  // setFetch(fetch)
  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname

    // Read routes
    if (pathname.startsWith(`/update`)) {
      try {
        await updateAllGasCosts(event)
        const successResponse = new Response(
          `Successfully updated gas for ${MAINNET_CHAIN_ID}, ${POLYGON_CHAIN_ID} and ${AVALANCHE_CHAIN_ID}`,
          {
            ...DEFAULT_HEADERS,
            status: 200
          }
        )
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
