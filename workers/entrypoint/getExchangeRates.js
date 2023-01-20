import { log } from '../../utils/sentry'

// /exchange-rates
export const getExchangeRates = async (event, request) => {
  try {
    const storedExchangeRates = JSON.parse(await EXCHANGE_RATES.get('coingecko-data'))
    if (!storedExchangeRates) return null

    return storedExchangeRates
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}