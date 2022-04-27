import { ContractType } from '../../../constants/contractType'

export interface ContractMetadata {
  address: string
  version?: string
  type?: ContractType
}
