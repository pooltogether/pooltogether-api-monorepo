import { ContractMetadata } from './interfaces'
import { log } from '../../../utils/sentry'

/**
 *
 * @param waitUntil
 * @param chainId
 * @param rootContractMetadatas
 * @param getRootContractKey
 * @param getRelatedContractAddresses
 * @returns
 */
export async function updateHandler<RelatedContractAddresses>(
  event: FetchEvent | ScheduledEvent,
  chainId: number,
  rootContractMetadatas: ContractMetadata[],
  getRootContractKey: (chainId: number) => string,
  getRelatedContractAddresses: (
    event: FetchEvent | ScheduledEvent,
    chainId: number,
    rootContractMetadata: ContractMetadata,
  ) => Promise<RelatedContractAddresses>,
) {
  // Fetch all related contract addresses
  const responses = await Promise.allSettled(
    rootContractMetadatas.map((rootContractMetadata) =>
      getRelatedContractAddresses(event, chainId, rootContractMetadata),
    ),
  )

  const relatedAddresses = []
  responses.map((response) => {
    const { status } = response
    if (status === 'fulfilled') {
      const { value } = response
      relatedAddresses.push(value)
    } else {
      event.waitUntil(
        log(
          new Error(JSON.stringify(response.reason)),
          (event as FetchEvent)?.request,
        ),
      )
    }
  })

  if (relatedAddresses.length === 0) {
    return {
      message: 'No contracts updated',
      responses,
      relatedAddresses,
      rootContractMetadatas,
    }
  }

  let storedAddresses: { [rootAddress: string]: RelatedContractAddresses } = {}
  try {
    const unformattedStoredAddresses = await CONTRACT_ADDRESSES.get(
      getRootContractKey(chainId),
    )
    storedAddresses = JSON.parse(unformattedStoredAddresses) as {
      [rootAddress: string]: RelatedContractAddresses
    }
  } catch (e) {
    console.warn(e.message)
    console.warn('No contract addresses found in KV. Initializing empty store.')
  }

  // Add newly fetched addresses to store
  const updatedStoredAddresses = {
    ...storedAddresses,
  }

  for (const addresses of relatedAddresses) {
    updatedStoredAddresses[addresses.metadata.address] = addresses
  }

  const stringifiedUpdates = JSON.stringify(updatedStoredAddresses)

  event.waitUntil(
    CONTRACT_ADDRESSES.put(getRootContractKey(chainId), stringifiedUpdates, {
      metadata: {
        lastUpdated: new Date(Date.now()).toUTCString(),
      },
    }),
  )

  return updatedStoredAddresses
}
