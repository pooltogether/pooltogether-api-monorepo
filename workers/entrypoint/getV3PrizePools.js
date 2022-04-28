import { getRootContractAddresses } from './utils/getRootContractAddresses'
import { getRootContractAddressesByChainId } from './utils/getRootContractAddressesByChainId'

import { getV3PrizePoolAddressesKey } from '../../utils/kvKeys'
import { log } from '../../utils/sentry'

/**
 * GET /v3/addresses/prize-pools/:chainId/:prizePoolAddress
 * @param {*} event
 * @param {*} request
 * @returns
 */
export const getV3PrizePool = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[4], 10)
    const prizePoolAddress = pathname.split('/')[5].toLowerCase()
    return getRootContractAddresses(chainId, prizePoolAddress, getV3PrizePoolAddressesKey)
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}

/**
 * GET /v3/addresses/prize-pools/:chainId
 * @param {*} event
 * @param {*} request
 * @returns
 */
export const getV3PrizePoolsByChainId = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[4], 10)
    return getRootContractAddressesByChainId(chainId, getV3PrizePoolAddressesKey)
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}
