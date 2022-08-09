import { DEFAULT_HEADERS } from './constants'

export const getErrorResponse = () => {
  const errorResponse = new Response('Error', {
    ...DEFAULT_HEADERS,
    status: 500
  })
  errorResponse.headers.set('Content-Type', 'text/plain')
  return errorResponse
}
