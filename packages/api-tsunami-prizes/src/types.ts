export { Contract as ContractMetadata, ContractList } from '@pooltogether/contract-list-schema'

export interface PrizeDistributorData {
  chainId: number
  address: string
}

export interface PrizeDistributors {
  [id: string]: PrizeDistributorData
}
