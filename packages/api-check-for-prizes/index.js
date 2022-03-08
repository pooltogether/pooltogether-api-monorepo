import { DEFAULT_HEADERS } from '../../utils/constants'
import { log } from '../../utils/sentry'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

const getMonday = (date) => {
  date = new Date(date)

  const day = date.getDay(),
    diff = date.getDate() - day + (day == 0 ? -6 : 1)

  return new Date(date.setDate(diff))
}

const storeAddressInKV = async (event, dateKey, address) => {
  let dateStrings = []

  const dateStringsJson = await CHECK_FOR_PRIZES.get(address)
  if (dateStringsJson) {
    dateStrings = JSON.parse(dateStringsJson)
  }

  // Bail early if we already have this date in the addresses' array
  if (dateStrings.includes(dateKey)) {
    return
  }

  dateStrings.push(dateKey)

  event.waitUntil(CHECK_FOR_PRIZES.put(address, JSON.stringify(dateStrings)), {
    metadata: {
      lastUpdated: new Date(Date.now()).toUTCString()
    }
  })
}

const addressIsValid = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Allow manual updates
 * @param {Event} event
 */
async function handleRequest(event) {
  try {
    const request = event.request
    const _url = new URL(request.url)
    const pathname = _url.pathname

    const monday = getMonday(new Date())
    const dateKey = monday.toISOString().split('T')[0]

    let address = _url.searchParams.get('address')
    if (address) {
      address = address.toLowerCase()
    }

    // Read routes
    if (pathname.startsWith(`/check`) && address && addressIsValid(address)) {
      try {
        await storeAddressInKV(event, dateKey, address)

        const successResponse = new Response(`Success`, {
          ...DEFAULT_HEADERS,
          status: 200
        })
        successResponse.headers.set('Content-Type', 'text/plain')
        return successResponse
      } catch (e) {
        event.waitUntil(log(e, e.request))
        console.log('error')
        const errorResponse = new Response(
          `Error setting prize check for dateKey ${dateKey} and address ${address}`,
          {
            ...DEFAULT_HEADERS,
            status: 500
          }
        )
        errorResponse.headers.set('Content-Type', 'text/plain')
        return errorResponse
      }
    }

    const notFoundResponse = new Response('Invalid request', {
      ...DEFAULT_HEADERS,
      status: 500
    })
    notFoundResponse.headers.set('Content-Type', 'text/plain')
    return notFoundResponse
  } catch (e) {
    event.waitUntil(log(e, e.request))

    const errorResponse = new Response('Error', {
      ...DEFAULT_HEADERS,
      status: 500
    })
    errorResponse.headers.set('Content-Type', 'text/plain')
    return errorResponse
  }
}
