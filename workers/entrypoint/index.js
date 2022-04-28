import { log } from '../../utils/sentry'
import { getCachedResponse } from '../../utils/getCachedResponse'
import { DEFAULT_HEADERS } from '../../utils/constants'
import { getPool } from './getPool'
import { getPools } from './getPools'
import { getPod } from './getPod'
import { getPods } from './getPods'
import { getGasCosts } from './getGasCosts'
import { getV4PrizePool, getV4PrizePoolsByChainId } from './getV4PrizePools'
import { getV4PrizeDistributor, getV4PrizeDistributorsByChainId } from './getV4PrizeDistributors'
import { getV3PrizePool, getV3PrizePoolsByChainId } from './getV3PrizePools'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
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

    // V3
    const singlePoolRegex = /\/pools\/[\d]*\/0x[a-fA-F0-9]{40}/
    const multiPoolRegex = /\/pools\/[\d]*/
    const singlePodRegex = /\/pods\/[\d]*\/0x[a-fA-F0-9]{40}/
    const multiPodRegex = /\/pods\/[\d]*/
    const singleV3PrizePoolRegex = /\/v3\/addresses\/prize-pools\/[\d]*\/0x[a-fA-F0-9]{40}/
    const multiV3PrizePoolRegex = /\/v3\/addresses\/prize-pools\/[\d]*/
    // V4
    const singleV4PrizePoolRegex = /\/v4\/addresses\/prize-pools\/[\d]*\/0x[a-fA-F0-9]{40}/
    const multiV4PrizePoolRegex = /\/v4\/addresses\/prize-pools\/[\d]*/
    const singleV4PrizeDistributorRegex = /\/v4\/addresses\/prize-distributors\/[\d]*\/0x[a-fA-F0-9]{40}/
    const multiV4PrizeDistributorRegex = /\/v4\/addresses\/prize-distributors\/[\d]*/
    // Meta
    const gasCostsRegex = /\/gas\/[\d]*/

    // Read routes
    if (singlePoolRegex.test(pathname)) {
      return getCachedResponse(event, getPool(event, request), 5)
    } else if (multiPoolRegex.test(pathname)) {
      return getCachedResponse(event, getPools(event, request), 5)
    } else if (singlePodRegex.test(pathname)) {
      return getCachedResponse(event, getPod(event, request), 5)
    } else if (multiPodRegex.test(pathname)) {
      return getCachedResponse(event, getPods(event, request), 5)
    } else if (gasCostsRegex.test(pathname)) {
      return getCachedResponse(event, getGasCosts(event, request), 5)
    } else if (singleV3PrizePoolRegex.test(pathname)) {
      return getCachedResponse(event, getV3PrizePool(event, request), 5)
    } else if (multiV3PrizePoolRegex.test(pathname)) {
      return getCachedResponse(event, getV3PrizePoolsByChainId(event, request), 5)
    } else if (singleV4PrizePoolRegex.test(pathname)) {
      return getCachedResponse(event, getV4PrizePool(event, request), 5)
    } else if (multiV4PrizePoolRegex.test(pathname)) {
      return getCachedResponse(event, getV4PrizePoolsByChainId(event, request), 5)
    } else if (singleV4PrizeDistributorRegex.test(pathname)) {
      return getCachedResponse(event, getV4PrizeDistributor(event, request), 5)
    } else if (multiV4PrizeDistributorRegex.test(pathname)) {
      return getCachedResponse(event, getV4PrizeDistributorsByChainId(event, request), 5)
    }

    const invalidRequestResponse = new Response(
      `Invalid request. See https://github.com/pooltogether/pooltogether-api-monorepo/ for more info.`,
      {
        ...DEFAULT_HEADERS,
        status: 400
      }
    )
    invalidRequestResponse.headers.set('Content-Type', 'text/plain')
    return invalidRequestResponse
  } catch (e) {
    event.waitUntil(log(e, e.request))

    const errorResponse = new Response(`Error\n${e.message}`, {
      ...DEFAULT_HEADERS,
      status: 500
    })
    errorResponse.headers.set('Content-Type', 'text/plain')
    return errorResponse
  }
}
