import { getRootContractAddresses } from './utils/getRootContractAddresses'
import { getRootContractAddressesByChainId } from './utils/getRootContractAddressesByChainId'

import { getV4PrizePoolsKey } from '../../utils/kvKeys'
import { log } from '../../utils/sentry'

/**
 * GET /v4/addresses/prize-pools/:chainId/:prizePoolAddress
 * @param {*} event
 * @param {*} request
 * @returns
 */
export const getV4PrizePool = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[4], 10)
    const prizePoolAddress = pathname.split('/')[5].toLowerCase()
    return getRootContractAddresses(chainId, prizePoolAddress, getV4PrizePoolsKey)
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}

/**
 * GET /v4/addresses/prize-pools/:chainId
 * @param {*} event
 * @param {*} request
 * @returns
 */
export const getV4PrizePoolsByChainId = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[4], 10)
    return getRootContractAddressesByChainId(chainId, getV4PrizePoolsKey)
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}
