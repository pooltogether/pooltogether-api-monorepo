import { getGasKey } from '../../utils/kvKeys'
import { getGasChainIdMapping } from '../../utils/getGasChainIdMapping'
import { log } from '../../utils/sentry'

// /gas/[chainId].json
export const getGasCosts = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[2], 10)
    const mappedChainId = getGasChainIdMapping(chainId)

    const storedGas = JSON.parse(await GAS.get(getGasKey(mappedChainId)))
    if (!storedGas) return null

    return storedGas
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}
