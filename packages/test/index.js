// import { usePools } from 'lib/hooks/usePool'
import { usePoolByAddress } from 'lib/hooks/usePool'

import Router from 'lib/router'

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
  const _url = new URL(request.url)
  const path = _url.pathname
  const chainId = parseInt(path.split('/')[2], 10)
  // remove the .json extension
  const poolAddress = path.split('/')[3].split('.')[0]

  const pool = await usePoolByAddress(chainId, poolAddress)

  return jsonResponse(pool)
}

function jsonResponse(data) {
  const config = {
    headers: { 'content-type': 'application/json' }
  }
  const body = JSON.stringify(data, null, 2)

  console.log('**************')
  console.log('SUCCESS!')
  console.log('**************')
  console.log(body)

  return new Response(body, config)
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

  r.get('.*/pools/.*/.*.json', (request) => poolHandler(request))

  const errorMsg = `Hello :) Please use one of the following paths:\n\nAll pools:     /pools/:chainId.json\nSpecific pool: /pools/:chainId/:poolAddress.json\n\nExample: /pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json`
  r.get('/', () => new Response(errorMsg))

  const response = await r.route(request)

  return response
}

// addEventListener('fetch', (event) => {
//   event.respondWith(handleRequest(event.request))
// })

const request = { url: 'https://api.com/pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json' }
poolHandler(request)
