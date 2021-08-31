import { log } from '../../utils/sentry'
import { DEFAULT_HEADERS } from '../../utils/constants'
import { getUsersPrizes } from './getUsersPrizes'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

/**
 * Fetch a users prizes for a list of draw ids.
 * /:chainId/:prizePoolAddress/prizes/:usersAddress?draws=<draw ids>
 * @param {Event} event
 */
async function handleRequest(event) {
  setInfuraId(INFURA_ID)
  setQuicknodeId(QUICKNODE_ID)

  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname

    const splitPathname = pathname.split('/')
    const chainId = splitPathname[0]
    const prizePoolAddress = splitPathname[1]
    const usersAddress = splitPathname[3]
    const draws = _url.searchParams.get('draws')

    // Routes
    if (true) {
      const prizes = await getUsersPrizes(chainId, prizePoolAddress, usersAddress, draws)
      const jsonBody = JSON.stringify(prizes, null, 2)
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

    return notFoundResponse
  } catch (e) {
    // Error
    event.waitUntil(log(e, e.request))

    const errorResponse = new Response(e?.message || 'Error', {
      ...DEFAULT_HEADERS,
      status: 500
    })
    errorResponse.headers.set('Content-Type', 'text/plain')
    return errorResponse
  }
}

function setInfuraId(INFURA_ID) {
  throw new Error('Function not implemented.')
}

function setQuicknodeId(QUICKNODE_ID) {
  throw new Error('Function not implemented.')
}
