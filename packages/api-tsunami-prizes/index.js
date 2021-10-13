import { log } from '../../utils/sentry'
import { DEFAULT_HEADERS } from '../../utils/constants'
import { getUsersPrizes } from './getUsersPrizes'
import { ethers } from 'ethers'
import _fetch from 'cross-fetch'

fetch = _fetch

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

/**
 * Fetch a users prizes for a list of draw ids.
 * /:chainId/:prizePoolAddress/prizes/:usersAddress/:drawId
 * @param {Event} event
 */
async function handleRequest(event) {
  try {
    console.log('fetch')
    console.log(fetch)
    console.log('_fetch')
    console.log(_fetch)
    console.log('globalThis')
    console.log(JSON.stringify(Object.keys(globalThis)))
    console.log('global')
    console.log(JSON.stringify(Object.keys(global)))
    const provider = new ethers.providers.JsonRpcProvider(
      `https://rinkeby.infura.io/v3/${INFURA_ID}`,
      4
    )
    let b = await provider.getBalance('0x27fcf06DcFFdDB6Ec5F62D466987e863ec6aE6A0')
    console.log('balance', 4, JSON.stringify(b))
    return new Response()
  } catch (e) {
    console.log('ERROR', e.message)
    return new Response()
  }

  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname

    console.log(pathname)

    // Routes
    const prizeRouteRegex = new RegExp('/[0-9]+/0x[0-9a-fA-F]{40}/prizes/0x[0-9a-fA-F]{40}/[0-9]+')
    if (prizeRouteRegex.test(pathname)) {
      const splitPathname = pathname.split('/')
      const chainId = splitPathname[0]
      const prizePoolAddress = splitPathname[1]
      const usersAddress = splitPathname[3]
      const drawId = splitPathname[4]

      const drawResult = await getUsersPrizes(chainId, prizePoolAddress, usersAddress, drawId)
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
