import { CoingeckoExchangeRates } from '@pooltogether/hooks'

/**
 * @param event
 * @param exchangeRates
 * @returns
 */
export const updateHandler = async (
  event: FetchEvent | ScheduledEvent,
  exchangeRates?: CoingeckoExchangeRates
) => {
  if (!exchangeRates) {
    return {
      message: 'No exchange rates updated.',
      exchangeRates
    }
  }

  const stringifiedUpdates = JSON.stringify(exchangeRates)

  event.waitUntil(
    EXCHANGE_RATES.put('coingecko-data', stringifiedUpdates, {
      metadata: {
        lastUpdated: new Date(Date.now()).toUTCString()
      }
    })
  )

  return exchangeRates
}
