import { pooltogetherApiRunner } from 'pooltogether-api-runner'

const Router = require('./router')

const url1Path = '/pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json'
const url1 = `https://pooltogether-api-the-graph-requests.bergeron3333.workers.dev${url1Path}`
const url3 = `https://pooltogether-api-the-graph-requests.bergeron3333.workers.dev/pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json`
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
// const init = {
//   headers: { 'Content-Type': type }
// }

// async function poolsHandler(request) {
//   const _url = new URL(request.url)
//   const path = _url.pathname
//   const chainId = parseInt(path.split('/')[2], 10).split('.')[0]
//   console.log('chainId')
//   console.log(chainId)

//   const pools = await usePools(chainId)

//   return jsonResponse(pools)
// }

async function poolHandler(request) {
  console.log('request.url')
  console.log(request.url)

  const _url = new URL(request.url)
  const path = _url.pathname
  const chainId = parseInt(path.split('/')[2], 10)
  // remove the .json extension
  const poolAddress = path.split('/')[3].split('.')[0]

  // 0xebfb47a7ad0fd6e57323c8a42b2e5a6a4f68fc1a
  // TODO: 1. get subgraph data:
  const apiGraphUrl = `${url1}/pools/${chainId}/${poolAddress}.json`
  console.log(apiGraphUrl)

  // const poolGraphDataJsonUrl = await fetch(apiGraphUrl, {
  //   // method: "POST",
  //   // body: JSON.stringify(tx),
  //   headers: { 'Content-Type': 'application/json' }
  // })
  // return await response.json()

  // const body = await poolGraphDataJsonUrl.json()
  // console.log(body)

  // TODO: 2. get chain data:
  console.log('wtf')

  // 3. Promise chain:
  const responses = await Promise.all([
    // fetch(apiGraphUrl, init),
    fetch(url1, init),
    fetch(url3, init),
    fetch(url3, init)
  ])
  console.log('responses')
  console.log(responses)
  const results = await Promise.all([
    gatherResponse(responses[0]),
    gatherResponse(responses[1]),
    gatherResponse(responses[2])
  ])
  return new Response(JSON.stringify(results.join(), null, 2), init)

  // TODO: 4. combine it all together:
  // const pool = body
  // const pool = results
  // const pool = 2

  // return jsonResponse(2)
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

async function callInfura(event) {
  // const resp = await fetch('https://')
  // const infuraResult = await callInfura(event)
}

async function cacheResource(event) {
  const url = new URL(event.request.url)

  // Only use the path for the cache key, removing query strings
  // and always store using HTTPS e.g. https://www.example.com/file-uri-here
  const someCustomKey = `https://${url.hostname}${url.pathname}`

  let response = await fetch(event.request, {
    cf: {
      // Always cache this fetch regardless of content type
      // for a max of 5 seconds before revalidating the resource
      cacheTtl: 5,
      cacheEverything: true,
      // Enterprise only feature, see Cache API for other plans
      cacheKey: someCustomKey
    }
  })

  // Reconstruct the Response object to make its headers mutable.
  response = new Response(response.body, response)

  // Set cache control headers to cache on browser for 25 minutes
  response.headers.set('Cache-Control', 'max-age=1500')

  return response
}

async function handleRequest(request) {
  const r = new Router()

  // TODO: Fix this:
  // r.get('.*/pools/.*.json', (request) => poolsHandler(request))
  console.log('here')

  r.get('.*/pools/.*/.*.json', (request) => poolHandler(request))

  const errorMsg = `Hello :) Please use one of the following paths:\n\nAll pools:     /pools/:chainId.json\nSpecific pool: /pools/:chainId/:poolAddress.json\n\nExample: /pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json`
  r.get('/', () => new Response(errorMsg))

  const response = await r.route(request)

  return response
}

addEventListener('fetch', (event) => {
  console.log('hi')
  event.respondWith(handleRequest(event.request))
})
