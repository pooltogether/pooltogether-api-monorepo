import { DEFAULT_HEADERS } from './constants'

export const getInvalidApiRequestResponse = () => {
  const invalidRequestResponse = new Response(
    `Invalid request. See https://github.com/pooltogether/pooltogether-api-monorepo/ for more info.`,
    {
      ...DEFAULT_HEADERS,
      status: 400
    }
  )
  invalidRequestResponse.headers.set('Content-Type', 'text/plain')
  return invalidRequestResponse
}
