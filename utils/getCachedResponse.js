import { DEFAULT_HEADERS, DEFAULT_CACHE_AGE } from './constants'

export async function getCachedResponse(event, promise, cacheAgeSeconds = DEFAULT_CACHE_AGE) {
  const request = event.request
  const cacheUrl = new URL(request.url)

  // Construct the cache key from the cache URL
  const cacheKey = new Request(cacheUrl.toString(), request)
  const cache = caches.default

  // Check whether the value is already available in the cache
  // if not, you will need to fetch it from origin, and store it in the cache
  // for future access
  let response = await cache.match(cacheKey)

  if (!response) {
    // If not in cache, get it from origin
    let body = await promise
    const jsonBody = JSON.stringify(body, null, 2)

    // Must use Response constructor to inherit all of response's fields
    response = new Response(jsonBody, DEFAULT_HEADERS)

    // Cache the query for a period of time
    response.headers.set('Cache-Control', `max-age=${cacheAgeSeconds}`)

    // CORS Headers
    response.headers.set('Access-Control-Allow-Origin', `*`)
    response.headers.set('Access-Control-Allow-Methods', `GET, HEAD, POST, OPTIONS`)
    response.headers.set('Access-Control-Request-Method', `*`)
    response.headers.set('Vary', `Accept-Encoding, Origin`)

    // Use waitUntil so you can return the response without blocking on writing to cache
    event.waitUntil(cache.put(cacheKey, response.clone()))
  } else {
    console.log('cache hit!')
  }

  return response
}
