import { getPools } from 'lib/services/getPools'
import { getPool } from 'lib/services/getPool'
import { updatePools } from 'lib/services/updatePools'
import { NETWORK } from '@pooltogether/utilities'
import { log } from 'lib/utils/sentry'

const DEFAULT_CACHE_AGE = 60
const ENVIRONMENT = ENVIRONMENT_NAME
const Enviroment = Object.keys({
  production: 'production',
  testnets: 'testnets',
  dev: 'dev'
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Request-Method': '*',
  'Vary': 'Accept-Encoding, Origin'
}
const type = 'application/json;charset=UTF-8'
const init = {
  headers: {
    ...corsHeaders,
    'Access-Control-Allow-Headers': '*',
    'Content-Type': type
  }
}

function getPathName(request) {
  const _url = new URL(request.url)
  const pathname = _url.pathname
  return pathname
}

async function getResponse(event, promise, cacheAgeSeconds = DEFAULT_CACHE_AGE) {
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
    response.headers.set('Cache-Control', `s-maxage=${cacheAgeSeconds}`)

    // CORS Headers
    response.headers.set('Access-Control-Allow-Origin', `*`)
    response.headers.set('Access-Control-Allow-Methods', `GET, HEAD, POST, OPTIONS`)
    response.headers.set('Access-Control-Request-Method', `*`)
    response.headers.set('Vary', `Accept-Encoding, Origin`)

    // Use waitUntil so you can return the response without blocking on
    // writing to cache
    event.waitUntil(cache.put(cacheKey, response.clone()))
  } else {
    console.log('cache hit!')
  }

  return response
}

// ROUTE HANDLERS

async function multiPoolHandler(event) {
  try {
    const request = event.request
    return getResponse(event, getPools(event, request))
  } catch (e) {
    event.waitUntil(log(e, event.request))
    return new Response(e.message, { status: 500 })
  }
}

async function singlePoolHandler(event) {
  try {
    const request = event.request
    return getResponse(event, getPool(event, request))
  } catch (e) {
    event.waitUntil(log(e, event.request))
    return new Response(e.message, { status: 500 })
  }
}

// NOTE: Manual update endpoint.
// This is handled by the cron but is useful for debugging.
// Uncomment the route in handleRequest to use.
async function updatePoolsHandler(event) {
  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname
    const chainId = Number(pathname.split('/')[2])
    await updatePools(event, chainId)
    return new Response(`Success updating ${chainId}`, { status: 200 })
  } catch (e) {
    event.waitUntil(log(e, event.request))
    return new Response(e.message, { status: 500 })
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

// CRON JOB

function getChainIds() {
  return [NETWORK.mainnet, NETWORK.rinkeby, NETWORK.polygon]
}

async function updatePoolsScheduledHandler(event) {
  try {
    const chainIds = getChainIds()
    const promises = chainIds.map((chainId) => updatePools(event, chainId))
    const responses = await Promise.allSettled(promises)

    responses.map((response) => {
      if (response.status === 'rejected') {
        event.waitUntil(log(response.reason, event.request))
      }
    })

    return true
  } catch (e) {
    event.waitUntil(log(e, event.request))
    return false
  }
}

addEventListener('scheduled', (event) => {
  event.waitUntil(updatePoolsScheduledHandler(event))
})

/**
 * The router for requests
 */
async function handleRequest(event) {
  console.log(event, JSON.stringify(event))
  const request = event.request
  const pathname = getPathName(request)

  const singlePoolRegex = /\/pools\/[\d]*\/[A-Za-z0-9]*.json/
  const multiPoolRegex = /\/pools\/[\d]*.json/
  const updatePoolsRegex = /\/update\/[\d]*/

  if (singlePoolRegex.test(pathname)) {
    return singlePoolHandler(event)
  } else if (multiPoolRegex.test(pathname)) {
    return multiPoolHandler(event)
  } else if (updatePoolsRegex.test(pathname)) {
    return updatePoolsHandler(event)
  } else {
    const errorMsg = `Hello :) Please use one of the following paths:\n\nAll pools:     /pools/:chainId.json\nSpecific pool: /pools/:chainId/:poolAddress.json\n\nExample: /pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json`
    return new Response(errorMsg, init)
  }
}
