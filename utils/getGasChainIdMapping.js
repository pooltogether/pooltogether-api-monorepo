const GAS_COST_CHAIN_ID_MAP = {
  1: 1,
  3: 1,
  4: 1,
  5: 1,
  137: 137,
  80001: 137,
  43114: 43114,
  43113: 43114,
  10: 10,
  69: 10
}

export const getGasChainIdMapping = (chainId) => {
  return GAS_COST_CHAIN_ID_MAP[chainId]
}
