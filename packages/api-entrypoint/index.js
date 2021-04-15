import { pool, pools } from '@pooltogether/api-runner'

const SINGLE_QUERY_CACHE_AGE_IN_SECONDS = 59
const MULTI_QUERY_CACHE_AGE_IN_SECONDS = 119

function path(request) {
  const _url = new URL(request.url)
  const pathname = _url.pathname
  return pathname
}

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
//   'Access-Control-Max-Age': '86400',
//   'Access-Control-Request-Method': '*',
//   'Vary': 'Accept-Encoding, Origin'
// }
const type = 'application/json;charset=UTF-8'
// const init = {
//   headers: {
//     ...corsHeaders,
//     'Access-Control-Allow-Headers': '*',
//     'Content-Type': type
//   }
// }

async function poolsHandler(event) {
  const request = event.request
  return useCache(event, pools(request, fetch), MULTI_QUERY_CACHE_AGE_IN_SECONDS)
}

async function poolHandler(event) {
  const request = event.request
  return useCache(event, pool(request, fetch), SINGLE_QUERY_CACHE_AGE_IN_SECONDS)
}

async function useCache(event, promise, cacheAgeSeconds) {
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
    response = new Response(jsonBody, response)
    response.headers.set('Content-Type', type)

    // Cache the query for multiple pools for a longer period of time
    // as it's much heavier on the CPU usage and can be blocked by Cloudflare
    response.headers.set('Cache-Control', `max-age=${cacheAgeSeconds}`)
    // response.headers.append('Cache-Control', `s-maxage=${cacheAgeSeconds}`)

    // Use waitUntil so you can return the response without blocking on
    // writing to cache
    event.waitUntil(cache.put(cacheKey, response.clone()))
  } else {
    console.log('cache hit!')
  }

  return response
}

async function handleRequest(event) {
  const request = event.request
  const pathname = path(request)

  const singlePoolRegex = /\/pools\/\d\/[A-Za-z0-9]*.json/
  const multiPoolRegex = /\/pools\/\d.json/
  if (singlePoolRegex.test(pathname)) {
    return poolHandler(event)
  } else if (multiPoolRegex.test(pathname)) {
    return poolsHandler(event)
  } else {
    const errorMsg = `Hello :) Please use one of the following paths:\n\nAll pools:     /pools/:chainId.json\nSpecific pool: /pools/:chainId/:poolAddress.json\n\nExample: /pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json`
    return new Response(errorMsg)
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})
