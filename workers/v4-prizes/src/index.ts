import { log } from '../../../utils/sentry'
import { getCachedResponse } from '../../../utils/getCachedResponse'
import { getErrorResponse } from '../../../utils/getErrorResponse'
import { getInvalidApiRequestResponse } from '../../../utils/getInvalidApiRequestResponse'
import { computeUsersPrizes } from './handlers/computeUsersPrizes'
import { aggregateComputedUsersPrizes } from './handlers/aggregateComputedUsersPrizes'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

/**
 * Fetch a users prizes for a list of draw ids.
 * /:chainId/:prizeDistributorAddress/prizes/:usersAddress/:drawId
 * @param {Event} event
 */
async function handleRequest(event: FetchEvent) {
  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname

    // Routes
    // Modern
    const computePrizesRegex = new RegExp(
      '/compute/[0-9]+/0x[0-9a-fA-F]{40}/prizes/0x[0-9a-fA-F]{40}/[0-9]+'
    )
    const aggregateComputedPrizesRegex = new RegExp('/prizes/0x[0-9a-fA-F]{40}')
    // Legacy
    const prizeRouteLegacyRegex = new RegExp(
      '/[0-9]+/0x[0-9a-fA-F]{40}/prizes/0x[0-9a-fA-F]{40}/[0-9]+'
    )

    if (prizeRouteLegacyRegex.test(pathname) || computePrizesRegex.test(pathname)) {
      return getCachedResponse(event, computeUsersPrizes(event), 604800)
    } else if (aggregateComputedPrizesRegex.test(pathname)) {
      return getCachedResponse(event, aggregateComputedUsersPrizes(event))
    }

    return getInvalidApiRequestResponse()
  } catch (e) {
    // Error
    event.waitUntil(log(e, e.request))
    return getErrorResponse()
  }
}
