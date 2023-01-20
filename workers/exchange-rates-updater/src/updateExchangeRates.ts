import { log } from '../../../utils/sentry'
import { updateHandler } from './updateHandler'

export interface CoingeckoExchangeRates {
  [id: string]: {
    name: string
    unit: string
    value: number
    type: 'crypto' | 'fiat' | 'commodity'
  }
}

/**
 * @param event
 * @returns
 */
export const updateExchangeRates = async (event: FetchEvent | ScheduledEvent) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/exchange_rates')
    const jsonResponse = await response.json<any>()
    const exchangeRates: CoingeckoExchangeRates = jsonResponse.rates
    return updateHandler(event, exchangeRates)
  } catch (e) {
    event.waitUntil(log(e, event))
    return undefined
  }
}
