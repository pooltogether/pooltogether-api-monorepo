import { PODS_SUPPORTED_CHAIN_IDS, updatePods } from './updaters/updatePods'
import {
  PRIZE_POOL_SUPPORTED_CHAIN_IDS,
  updatePrizePools,
} from './updaters/updatePrizePools'
import {
  PRIZE_DISTRIBUTORS_SUPPORTED_CHAIN_IDS,
  updatePrizeDistributors,
} from './updaters/updatePrizeDistributors'
import { log } from '../../../utils/sentry'

export async function handleScheduled(event: ScheduledEvent): Promise<boolean> {
  try {
    await Promise.allSettled([
      ...PODS_SUPPORTED_CHAIN_IDS.map((chainId) => updatePods(event, chainId)),
      ...PRIZE_POOL_SUPPORTED_CHAIN_IDS.map((chainId) =>
        updatePrizePools(event, chainId),
      ),
      ...PRIZE_DISTRIBUTORS_SUPPORTED_CHAIN_IDS.map((chainId) =>
        updatePrizeDistributors(event, chainId),
      ),
    ])
    return true
  } catch (e) {
    console.log(e)
    event.waitUntil(log(e))
    return false
  }
}
