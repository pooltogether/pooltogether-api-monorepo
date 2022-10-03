import Toucan from 'toucan-js'

/**
 * Expected env variables
 *
 *   EDGE_CACHE_TTL: number (default 60)
 *    - Duration cached requests should live on the edge
 *
 *   BROWSER_CACHE_TTL: number (default 0)
 *    - Duration browser should cache requests
 *
 *   PROVIDERS: string[]
 *    - Array of web3 provider endpoints to use. No PoolTogether proxies.
 *
 *   PROVIDER_TIMEOUT: number
 *    - Timeout in ms for requests to a provider before trying another
 */

const PROVIDER_TIMEOUT = 5000

const ALLOWED_ORIGINS = Object.freeze([
  'https://app.pooltogether.com',
  'https://app.pooltogether.us',
  'https://pooltogether.com',
  'https://pooltogether.us',
  'https://v4.pooltogether.com',
  'https://v4.pooltogether.us',
  'https://v3.pooltogether.com',
  'https://v3.pooltogether.us',
  'https://v2.pooltogether.com',
  'https://v2.pooltogether.us',
  'https://app-staging.pooltogether.com',
  'https://app-staging.pooltogether.us',
  'https://vote.pooltogether.com',
  'https://vote.pooltogether.us',
  'https://vote-staging.pooltogether.com',
  'https://vote-staging.pooltogether.us',
  'https://info.pooltogether.com',
  'https://info.pooltogether.us',
  'https://info-staging.pooltogether.com',
  'https://info-staging.pooltogether.us',
  'https://tools.pooltogether.com',
  'https://tools.pooltogether.us',
  'https://tools-staging.pooltogether.us',
  'https://tools-staging.pooltogether.com',
  'https://account-redesign--v4-ui.netlify.app',
  // 'http://localhost:3000'
])

/**
 * sha256 encodes a given string message
 * @param {string} message
 * Borrowed from
 * https://developers.cloudflare.com/workers/examples/cache-api
 */
async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message)
  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  // convert bytes to hex string
  const hashHex = hashArray
    .map((b) => ('00' + b.toString(16)).slice(-2))
    .join('')
  return hashHex
}

/**
 * Wrapper around fetch with an optional timeout
 * @param {Url} url
 * @param {Request} request
 * @param {number} timeout
 */
async function fetchWithTimeout(url, request, timeout) {
  return Promise.race([
    fetch(url, request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout),
    ),
  ])
}

/**
 * Recursively tries to get a response from a random provider
 * @param {string} url
 * @param {Event} event
 */
async function tryProvider(url, request, retry = 3) {
  const provider = new URL(PROVIDER)
  // Set the current URL hostname and pathname
  url.hostname = provider.hostname
  url.pathname = provider.pathname

  // Fetch the original request against the chosen provider and cache the result
  let response
  try {
    response = await fetchWithTimeout(url, request.clone(), PROVIDER_TIMEOUT)
    if (!response.ok) throw new Error(`${url.toString()} not ok!`)
  } catch (e) {
    if (retry <= 0) {
      throw new Error(`RPC not ok!`)
    }
    console.error(e.message || e)
    response = await tryProvider(url, request, retry - 1)
  }
  return response
}

/**
 * Gets a response from the origin. In our case, a web3 provider endpoint.
 * @param {string} url
 * @param {Event} event
 * @param {Request?} cacheKey if cacheKey is not provided, the response is not cached
 */
async function getOriginResponse(url, event, cacheKey?: Request) {
  const cache = caches.default

  // Try origin requests until we get a response
  let response = await tryProvider(url, event.request)
  if (!cacheKey) return response

  const headers = { 'Cache-Control': `public, max-age=${EDGE_CACHE_TTL}` }
  response = new Response(response.body, { ...response, headers })
  event.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

/**
 * Formats a response, applying browser cache TTL as well as CORS headers
 * @param {Event} event
 * @param {Response} response
 * @param {object} body extra body content
 */
async function formatResponse(event, response, body?: any) {
  const request = event.request
  const headers = request.headers

  // Make a new response so headers mutable
  let formattedResponse
  if (body) {
    const originalBody = await response.json()
    const fullBody = JSON.stringify({ ...originalBody, ...body })
    formattedResponse = new Response(fullBody, response)
  } else {
    formattedResponse = new Response(response.body, response)
  }
  // Don't allow the browser to cache the response
  formattedResponse.headers.set('Cache-Control', `max-age=${BROWSER_CACHE_TTL}`)
  formattedResponse.headers.set(
    'Access-Control-Allow-Methods',
    'GET,HEAD,POST,OPTIONS',
  )
  formattedResponse.headers.set(
    'Access-Control-Allow-Origin',
    ALLOWED_ORIGINS.includes(headers.get('Origin'))
      ? headers.get('Origin')
      : ALLOWED_ORIGINS[0],
  )
  formattedResponse.headers.set('Access-Control-Allow-Headers', '*')
  return formattedResponse
}

/**
 * Handles OPTIONS requests
 * Borrowed from
 * https://developers.cloudflare.com/workers/examples/cors-header-proxy
 */
async function handleOptions(event) {
  const Sentry = new Toucan({
    dsn: SENTRY_DSN,
    context: event, // Includes 'waitUntil', which is essential for Sentry logs to be delivered. Also includes 'request' -- no need to set it separately.
    allowedHeaders: ['user-agent'],
    allowedSearchParams: /(.*)/,
  })

  try {
    const request = event.request
    const url = new URL(request.url)
    const headers = request.headers

    if (
      headers.get('Origin') !== null &&
      headers.get('Access-Control-Request-Method') !== null &&
      headers.get('Access-Control-Request-Headers') !== null
    ) {
      // Handle CORS pre-flight request.
      // If you want to check or reject the requested method + headers
      // you can do that here.
      const respHeaders = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(
          headers.get('Origin'),
        )
          ? headers.get('Origin')
          : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
        'Access-Control-Max-Age': '86400', // 1 day,
        // Allow all future content Request headers to go back to browser
        // such as Authorization (Bearer) or X-Client-Name-Version
        'Access-Control-Allow-Headers': request.headers.get(
          'Access-Control-Request-Headers',
        ),
      }

      return new Response(null, {
        headers: respHeaders,
      })
    } else {
      // Handle standard OPTIONS request.
      // If you want to allow other HTTP Methods, you can do that here.
      return new Response(null, {
        headers: {
          Allow: 'GET, HEAD, POST, OPTIONS',
        },
      })
    }
  } catch (e) {
    event.waitUntil(Sentry.captureException(e))
    return new Response(null, { status: 500 })
  }
}

/**
 * Handles GET requests
 */
async function handleGet(event) {
  const Sentry = new Toucan({
    dsn: SENTRY_DSN,
    context: event, // Includes 'waitUntil', which is essential for Sentry logs to be delivered. Also includes 'request' -- no need to set it separately.
    allowedHeaders: ['user-agent'],
    allowedSearchParams: /(.*)/,
  })
  try {
    const request = event.request
    const url = new URL(request.url)
    const headers = request.headers
    const cache = caches.default

    if (!ALLOWED_ORIGINS.includes(headers.get('Origin'))) {
      return new Response(null, { status: 403 })
    }

    let response
    response = await cache.match(request)
    if (!response) {
      response = await getOriginResponse(url, request, request)
    }
    return formatResponse(event, response)
  } catch (e) {
    event.waitUntil(Sentry.captureException(e))
    return new Response(null, { status: 500 })
  }
}

/**
 * Handles POST requests
 */
async function handlePost(event) {
  const Sentry = new Toucan({
    dsn: SENTRY_DSN,
    context: event, // Includes 'waitUntil', which is essential for Sentry logs to be delivered. Also includes 'request' -- no need to set it separately.
    allowedHeaders: ['user-agent'],
    allowedSearchParams: /(.*)/,
  })
  const request = event.request
  try {
    const url = new URL(request.url)
    const headers = request.headers
    if (!ALLOWED_ORIGINS.includes(headers.get('Origin'))) {
      return new Response(null, { status: 403 })
    }

    const cache = caches.default
    const body = await request.clone().json()
    const { method, id, jsonrpc } = body

    // Don't cache eth block number calls
    const bypassCache = method === 'eth_blockNumber'
    if (bypassCache) {
      const response = await getOriginResponse(url, event)
      return formatResponse(event, response, { id })
    }

    // Create a cache key based on method, jsonrpc version, and the rest of the body
    const cacheable = { method, jsonrpc, ...body.params }
    const cacheableBody = JSON.stringify(cacheable)
    const hash = await sha256(cacheableBody)
    // Store the URL in cache by adding the body's hash
    url.pathname = '/posts' + url.pathname + hash
    // Convert to a GET to be able to cache
    const cacheKey = new Request(url.toString(), {
      headers: request.headers,
      method: 'GET',
    })

    let response = await cache.match(cacheKey)
    if (!response) {
      response = await getOriginResponse(url, event, cacheKey)
    }
    return formatResponse(event, response, { id })
  } catch (e) {
    event.waitUntil(Sentry.captureException(e))
    return new Response(null, { status: 500 })
  }
}

addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method.toUpperCase() === 'OPTIONS') {
    return event.respondWith(handleOptions(event))
  } else if (request.method.toUpperCase() === 'POST') {
    return event.respondWith(handlePost(event))
  }
  return event.respondWith(handleGet(event))
})
