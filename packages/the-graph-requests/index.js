import { usePoolByAddress } from 'lib/hooks/usePool'
// import { usePools } from 'lib/hooks/usePool'

const Router = require('./router')

// We support the GET, POST, HEAD, and OPTIONS methods from any origin,
// and allow any header on requests. These headers must be present
// on all responses to all CORS preflight requests. In practice, this means
// all responses to OPTIONS requests.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Request-Method': '*',
  // access-control-expose-headers: link, per-page, total
  'Vary': 'Accept-Encoding, Origin'
}
const type = 'application/json;charset=UTF-8'
const init = {
  // headers: { ...corsHeaders, 'Content-Type': type }
  headers: {
    ...corsHeaders,
    'Access-Control-Allow-Headers': '*',
    'Content-Type': type
  }
}

// async function poolsHandler(request) {
//   const chainId = parseInt(path(request).split('/')[2], 10).split('.')[0]
//   console.log('chainId')
//   console.log(chainId)

//   const pools = await usePools(chainId)

//   return jsonResponse(pools)
// }

function path(request) {
  const _url = new URL(request.url)
  const pathname = _url.pathname
  return pathname
}

async function poolHandler(request) {
  // split to remove the extension
  const pathname = path(request).split('.')[0]
  const chainId = parseInt(pathname.split('/')[2], 10)
  const poolAddress = pathname.split('/')[3]

  // const pool = 2
  const pool = await usePoolByAddress(chainId, poolAddress)

  console.log(init)
  return jsonResponse(pool)
}

async function jsonResponse(data) {
  const body = JSON.stringify(data, null, 2)

  console.log(body)

  // let response = await fetch(request)
  console.log('wtf')
  console.log(5)
  // const response = new Response(body, init)
  // console.log('response')
  // console.log(response)
  // console.log(response.headers)
  // response.headers.set('Access-Control-Allow-Origin', url.origin)
  // response.headers.append('Vary', 'Origin')
  // console.log(response)
  // console.log(response.headers)
  // return response

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

// addEventListener('fetch', (event) => {
//   event.respondWith(handleRequest(event.request))
// })

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

function handleOptions(request) {
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  let headers = request.headers
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS pre-flight request.
    // If you want to check or reject the requested method + headers
    // you can do that here.
    let respHeaders = {
      ...corsHeaders,
      // Allow all future content Request headers to go back to browser
      // such as Authorization (Bearer) or X-Client-Name-Version
      'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers')
    }

    return new Response(null, {
      headers: respHeaders
    })
  } else {
    // Handle standard OPTIONS request.
    // If you want to allow other HTTP Methods, you can do that here.
    return new Response(null, {
      headers: {
        Allow: 'GET, HEAD, POST, OPTIONS'
      }
    })
  }
}

addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method === 'OPTIONS') {
    // Handle CORS preflight requests
    event.respondWith(handleOptions(request))
  } else if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'POST') {
    // Handle requests to the API server
    event.respondWith(handleRequest(request))
  } else {
    event.respondWith(
      new Response(null, {
        status: 405,
        statusText: 'Method Not Allowed'
      })
    )
  }
})
