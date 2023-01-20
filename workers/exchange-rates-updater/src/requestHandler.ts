import { DEFAULT_HEADERS } from '../../../utils/constants'
import { log } from '../../../utils/sentry'
import { updateExchangeRates } from './updateExchangeRates'

/**
 * @param event
 * @returns
 */
export const handleRequest = async (event: FetchEvent): Promise<Response> => {
  try {
    const request = event.request
    const url = new URL(request.url)
    const pathname = url.pathname

    if (pathname.startsWith('/exchange-rates/update')) {
      const updates = await updateExchangeRates(event)

      if (!!updates && 'usd' in updates) {
        const successResponse = new Response(JSON.stringify(updates), {
          ...DEFAULT_HEADERS,
          status: 200
        })
        return successResponse
      } else {
        const failResponse = new Response(JSON.stringify(updates), {
          ...DEFAULT_HEADERS,
          status: 500
        })
        return failResponse
      }
    }

    const invalidRequestResponse = new Response(
      JSON.stringify({
        message: `Invalid request. See https://github.com/pooltogether/pooltogether-api-monorepo/ for more info.`,
      }),
      {
        ...DEFAULT_HEADERS,
        status: 400
      }
    )
    return invalidRequestResponse
  } catch (e) {
    console.log(e)
    event.waitUntil(log(e, e.request))

    const errorResponse = new Response('Error', {
      ...DEFAULT_HEADERS,
      status: 500
    })
    errorResponse.headers.set('Content-Type', 'text/plain')
    return errorResponse
  }
}
