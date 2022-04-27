import { getRootContractAddresses } from './utils/getRootContractAddresses'
import { getRootContractAddressesByChainId } from './utils/getRootContractAddressesByChainId'

import { getPrizePoolsKey } from '../../utils/kvKeys'
import { log } from '../../utils/sentry'

/**
 * GET /v4/addresses/prize-pools/:chainId/:prizePoolAddress
 * @param {*} event
 * @param {*} request
 * @returns
 */
export const getPrizePool = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[4], 10)
    const prizePoolAddress = pathname.split('/')[5].toLowerCase()
    console.log(chainId, prizePoolAddress)
    return getRootContractAddresses(chainId, prizePoolAddress, getPrizePoolsKey)
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
export const getPrizePoolsByChainId = async (event, request) => {
  try {
    const _url = new URL(request.url)
    const pathname = _url.pathname.split('.')[0]
    const chainId = parseInt(pathname.split('/')[4], 10)
    console.log(chainId, pathname)
    return getRootContractAddressesByChainId(chainId, getPrizePoolsKey)
  } catch (e) {
    event.waitUntil(log(e, request))
    return null
  }
}
