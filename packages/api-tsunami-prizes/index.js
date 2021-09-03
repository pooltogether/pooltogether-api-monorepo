import { log } from '../../utils/sentry'
import { DEFAULT_HEADERS } from '../../utils/constants'
// import { getUsersPrizes } from './getUsersPrizes'
import { Contract, ethers } from 'ethers'
import { ERC20Abi } from '../../abis/ERC20Abi'
import { contract } from '@pooltogether/etherplex'
import { batch } from './cloudflare-workers-batch'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

/**
 * Fetch a users prizes for a list of draw ids.
 * /:chainId/:prizePoolAddress/prizes/:usersAddress?draws=<draw ids>
 * @param {Event} event
 */
async function handleRequest(event) {
  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname

    // TESTING
    const tokenAddress = '0x26c6cc6422fefe460f48ea4971997fb97c33abac'
    const tokenContract = contract(tokenAddress, ERC20Abi, tokenAddress)
    let batchCalls = []
    batchCalls.push(
      tokenContract
        .decimals()
        .name()
        .symbol()
        .totalSupply()
    )
    const response = await batch(4, ...batchCalls)
    const data = {
      decimals: response[tokenAddress].decimals[0],
      name: response[tokenAddress].name[0],
      symbol: response[tokenAddress].symbol[0],
      totalSupplyUnformatted: response[tokenAddress].totalSupply[0],
      totalSupply: ethers.utils.formatUnits(
        response[tokenAddress].totalSupply[0],
        response[tokenAddress].decimals[0]
      )
    }
    const jsonBody = JSON.stringify(data, null, 2)
    const successResponse = new Response(jsonBody, {
      ...DEFAULT_HEADERS,
      status: 200
    })
    return successResponse

    // const splitPathname = pathname.split('/')
    // const chainId = splitPathname[0]
    // const prizePoolAddress = splitPathname[1]
    // const usersAddress = splitPathname[3]
    // const draws = _url.searchParams.get('draws')

    // // Routes
    // if (true) {
    //   const prizes = await getUsersPrizes(chainId, prizePoolAddress, usersAddress, draws)
    //   const jsonBody = JSON.stringify(prizes, null, 2)
    //   const successResponse = new Response(jsonBody, {
    //     ...DEFAULT_HEADERS,
    //     status: 200
    //   })
    //   return successResponse
    // }

    // // Invalid path
    // const notFoundResponse = new Response('Invalid request', {
    //   ...DEFAULT_HEADERS,
    //   status: 404
    // })
    // notFoundResponse.headers.set('Content-Type', 'text/plain')

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
