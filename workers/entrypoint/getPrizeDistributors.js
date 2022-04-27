import { getRootContractAddresses } from './utils/getRootContractAddresses'
import { getRootContractAddressesByChainId } from './utils/getRootContractAddressesByChainId'

import { getPrizeDistributorsKey } from '../../utils/kvKeys'
import { log } from '../../utils/sentry'

/**
 * GET /v4/addresses/prize-distributors/:chainId/:prizeDistributorAddress
 * @param {*} event
 * @param {*} request
 * @returns
 */
export const getPrizeDistributor = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[4], 10)
    const prizeDistributorAddress = pathname.split('/')[5].toLowerCase()
    return getRootContractAddresses(chainId, prizeDistributorAddress, getPrizeDistributorsKey)
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}

/**
 * GET /v4/addresses/prize-distributors/:chainId
 * @param {*} event
 * @param {*} request
 * @returns
 */
export const getPrizeDistributorsByChainId = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[4], 10)

    return getRootContractAddressesByChainId(chainId, getPrizeDistributorsKey)
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}
