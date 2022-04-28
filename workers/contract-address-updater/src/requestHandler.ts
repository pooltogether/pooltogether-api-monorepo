import { PODS_SUPPORTED_CHAIN_IDS, updatePods } from './updaters/updatePods'
import {
  PRIZE_POOL_SUPPORTED_CHAIN_IDS,
  updatePrizePools,
} from './updaters/updatePrizePools'
import {
  PRIZE_DISTRIBUTORS_SUPPORTED_CHAIN_IDS,
  updatePrizeDistributors,
} from './updaters/updatePrizeDistributors'
import { DEFAULT_HEADERS } from '../../../utils/constants'
import { log } from '../../../utils/sentry'
import {
  updateV3PrizePools,
  V3_PRIZE_POOL_SUPPORTED_CHAIN_IDS,
} from './updaters/updateV3PrizePools'

const ROUTES = Object.freeze({
  pods: '/pods',
  v3PrizePools: '/v3/prize-pools',
  prizePools: '/v4/prize-pools',
  prizeDistributors: '/v4/prize-distributors',
})

export async function handleRequest(event: FetchEvent): Promise<Response> {
  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname

    // Read routes
    if (pathname.startsWith(ROUTES.pods)) {
      return updateRouter(
        event,
        ROUTES.pods,
        PODS_SUPPORTED_CHAIN_IDS,
        updatePods,
      )
    } else if (pathname.startsWith(ROUTES.v3PrizePools)) {
      return updateRouter(
        event,
        ROUTES.v3PrizePools,
        V3_PRIZE_POOL_SUPPORTED_CHAIN_IDS,
        updateV3PrizePools,
      )
    } else if (pathname.startsWith(ROUTES.prizePools)) {
      return updateRouter(
        event,
        ROUTES.prizePools,
        PRIZE_POOL_SUPPORTED_CHAIN_IDS,
        updatePrizePools,
      )
    } else if (pathname.startsWith(ROUTES.prizeDistributors)) {
      return updateRouter(
        event,
        ROUTES.prizeDistributors,
        PRIZE_DISTRIBUTORS_SUPPORTED_CHAIN_IDS,
        updatePrizeDistributors,
      )
    }

    const notFoundResponse = new Response('Invalid request', {
      ...DEFAULT_HEADERS,
      status: 500,
    })
    notFoundResponse.headers.set('Content-Type', 'text/plain')
    return notFoundResponse
  } catch (e) {
    console.log(e.message)
    event.waitUntil(log(e, e.request))

    const errorResponse = new Response('Error', {
      ...DEFAULT_HEADERS,
      status: 500,
    })
    errorResponse.headers.set('Content-Type', 'text/plain')
    return errorResponse
  }
}

/**
 *
 * @param event
 * @param route
 * @param updater returns stringified JSON
 * @returns
 */
async function updateRouter(
  event: FetchEvent,
  route: string,
  supportedChainIds: number[],
  updater: (
    event: ScheduledEvent | FetchEvent,
    chainId: number,
  ) => Promise<object>,
): Promise<Response> {
  try {
    const request = event.request
    const url = new URL(request.url)
    const pathname = url.pathname

    // Read routes, fetch data, return response if success
    if (pathname.startsWith(`${route}/update`)) {
      const responses = await Promise.allSettled(
        supportedChainIds.map(async (chainId) => {
          return {
            chainId,
            addresses: await updater(event, chainId),
          }
        }),
      )
      const results = responses.map((result) =>
        result.status === 'fulfilled' ? result.value : result.reason,
      )
      const successResponse = new Response(JSON.stringify(results), {
        ...DEFAULT_HEADERS,
        status: 200,
      })
      return successResponse
    }

    const invalidRequestResponse = new Response(
      JSON.stringify({
        message: `Invalid request. See https://github.com/pooltogether/pooltogether-api-monorepo/ for more info.`,
      }),
      {
        ...DEFAULT_HEADERS,
        status: 400,
      },
    )
    return invalidRequestResponse
  } catch (e) {
    console.log(e.message)
    event.waitUntil(log(e, e.request))
    const errorResponse = new Response(
      JSON.stringify({
        message: `Error updating pods on chain ${CHAIN_ID}.\n${e.message}`,
      }),
      {
        ...DEFAULT_HEADERS,
        status: 500,
      },
    )
    return errorResponse
  }
}
