import { log } from '../../../utils/sentry'
import { updateExchangeRates } from './updateExchangeRates'

/**
 * @param event
 * @returns
 */
export const handleScheduled = async (event: ScheduledEvent): Promise<boolean> => {
  try {
    await updateExchangeRates(event)
    return true
  } catch (e) {
    console.log(e)
    event.waitUntil(log(e))
    return false
  }
}