import { pool, pools } from '@pooltogether/api-runner'
import Router from 'lib/router'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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

async function poolsHandler(request) {
  return jsonResponse(6)
  // return jsonResponse(await pools(request, fetch))
}

async function poolHandler(request) {
  const _pool = await pool(request, fetch)
  console.log('final pool')
  console.log(_pool)
  console.log(JSON.stringify(_pool))
  return jsonResponse(_pool)
}

/**
 * gatherResponse awaits and returns a response body as a string.
 * Use await gatherResponse(..) in an async function to get the response body
 * @param {Response} response
 */
async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return JSON.stringify(await response.json())
  } else if (contentType.includes('application/text')) {
    return await response.text()
  } else if (contentType.includes('text/html')) {
    return await response.text()
  } else {
    return await response.text()
  }
}

function jsonResponse(data) {
  const body = JSON.stringify(data, null, 2)

  return new Response(body, init)
}

// async function cacheResource(event) {
//   const url = new URL(event.request.url)

//   // Only use the path for the cache key, removing query strings
//   // and always store using HTTPS e.g. https://www.example.com/file-uri-here
//   const someCustomKey = `https://${url.hostname}${url.pathname}`

//   let response = await fetch(event.request, {
//     cf: {
//       // Always cache this fetch regardless of content type
//       // for a max of 5 seconds before revalidating the resource
//       cacheTtl: 5,
//       cacheEverything: true,
//       // Enterprise only feature, see Cache API for other plans
//       cacheKey: someCustomKey
//     }
//   })

//   // Reconstruct the Response object to make its headers mutable.
//   response = new Response(response.body, response)

//   // Set cache control headers to cache on browser for 25 minutes
//   response.headers.set('Cache-Control', 'max-age=1500')

//   return response
// }

async function handleRequest(request) {
  const r = new Router()

  // TODO: Fix this:
  // r.get('.*/pools/.*.json', (request) => poolsHandler(request))

  r.get('.*/pools/.*/.*.json', (request) => poolHandler(request))

  const errorMsg = `Hello :) Please use one of the following paths:\n\nAll pools:     /pools/:chainId.json\nSpecific pool: /pools/:chainId/:poolAddress.json\n\nExample: /pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json`
  r.get('/', () => new Response(errorMsg))

  const response = await r.route(request)

  return response
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})
