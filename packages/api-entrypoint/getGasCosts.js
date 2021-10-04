import { getGasKey } from '../../utils/kvKeys'
import { log } from '../../utils/sentry'

// /gas/[chainId].json
export const getGasCosts = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[2], 10)

    const storedGas = JSON.parse(await GAS.get(getGasKey(chainId)))
    if (!storedGas) return null

    return storedGas
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}
