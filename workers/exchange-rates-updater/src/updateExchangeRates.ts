import { getCoingeckoExchangeRates } from '@pooltogether/hooks'
import { log } from '../../../utils/sentry'
import { updateHandler } from './updateHandler'

/**
 * @param event
 * @returns
 */
export const updateExchangeRates = async (event: FetchEvent | ScheduledEvent) => {
  try {
    const exchangeRates = await getCoingeckoExchangeRates()
    return updateHandler(event, exchangeRates)
  } catch (e) {
    event.waitUntil(log(e, event))
    return undefined
  }
}
