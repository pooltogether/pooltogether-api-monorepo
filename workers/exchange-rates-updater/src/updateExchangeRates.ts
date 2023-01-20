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
    const url = new URL(`https://api.coingecko.com/api/v3/exchange_rates`)
    const response = await fetch(url.toString())
    const exchangeRates: CoingeckoExchangeRates = ((await response.json()) as any).rates
    return updateHandler(event, exchangeRates)
  } catch (e) {
    event.waitUntil(log(e, event))
    return undefined
  }
}
