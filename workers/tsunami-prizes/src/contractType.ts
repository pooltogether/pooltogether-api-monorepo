import { ContractMetadata } from './types'

// Copy pasta from v4-js-client
export enum ContractType {
  YieldSourcePrizePool = 'YieldSourcePrizePool',
  Ticket = 'Ticket',
  Token = 'Token',
  PrizeDistributor = 'PrizeDistributor',
  DrawBuffer = 'DrawBuffer',
  DrawBeacon = 'DrawBeacon',
  DrawCalculator = 'DrawCalculator',
  DrawCalculatorTimelock = 'DrawCalculatorTimelock',
  PrizeDistributionBuffer = 'PrizeDistributionBuffer'
  // ... more contract types
}

export function getContractsByType(contracts: ContractMetadata[], type: ContractType) {
  return contracts.filter((contract) => contract.type === type)
}
