import { log } from '../../../utils/sentry'
import { DEFAULT_HEADERS } from '../../../utils/constants'
import { getUsersPrizes } from './getUsersPrizes'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

/**
 * Fetch a users prizes for a list of draw ids.
 * /:chainId/:prizeDistributorAddress/prizes/:usersAddress/:drawId
 * @param {Event} event
 */
async function handleRequest(event) {
  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname

    // Routes
    const prizeRouteRegex = new RegExp('/[0-9]+/0x[0-9a-fA-F]{40}/prizes/0x[0-9a-fA-F]{40}/[0-9]+')
    if (prizeRouteRegex.test(pathname)) {
      const splitPathname = pathname.split('/')
      const chainId = splitPathname[1]
      const prizeDistributorAddress = splitPathname[2]
      const usersAddress = splitPathname[4]
      const drawId = splitPathname[5]

      const drawResult = await getUsersPrizes(
        chainId,
        prizeDistributorAddress,
        usersAddress,
        drawId
      )
      const jsonBody = JSON.stringify(drawResult, null, 2)
      const successResponse = new Response(jsonBody, {
        ...DEFAULT_HEADERS,
        status: 200
      })
      return successResponse
    }

    // Invalid path
    const notFoundResponse = new Response('Invalid request', {
      ...DEFAULT_HEADERS,
      status: 404
    })
    notFoundResponse.headers.set('Content-Type', 'text/plain')

    // return notFoundResponse
  } catch (e) {
    // Error
    event.waitUntil(log(e, e.request))

    const errorResponse = new Response('Error', {
      ...DEFAULT_HEADERS,
      status: 500
    })
    errorResponse.headers.set('Content-Type', 'text/plain')
    return errorResponse
  }
}
