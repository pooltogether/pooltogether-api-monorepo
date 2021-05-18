import { tokenBlockList } from '@pooltogether/current-pool-data'

export const ERC20_BLOCK_LIST = tokenBlockList

export const SECONDS_PER_BLOCK = 14

export const SECONDS_PER_WEEK = 604800
export const SECONDS_PER_DAY = 86400
export const SECONDS_PER_HOUR = 3600

export const DEFAULT_TOKEN_PRECISION = 18

export const ETHEREUM_NETWORKS = [1, 3, 4, 5, 42]

export const NETWORK = Object.freeze({
  'mainnet': 1,
  'homestead': 1,
  'ropsten': 3,
  'rinkeby': 4,
  'goerli': 5,
  'kovan': 42,
  'bsc': 56,
  'poa-sokol': 77,
  'bsc-testnet': 97,
  'poa': 99,
  'xdai': 100,
  'matic': 137,
  'polygon': 137,
  'mumbai': 80001
})

export const CUSTOM_CONTRACT_ADDRESSES = {
  1: {
    Stablecoin: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    Sablier: '0xA4fc358455Febe425536fd1878bE67FfDBDEC59a',
    CompoundComptroller: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
    COMP: '0xc00e94cb662c3520282e6f5717214004a7f26888'
  },
  4: {
    Stablecoin: '0x3b00ef435fa4fcff5c209a37d1f3dcff37c705ad',
    Sablier: '0xc04Ad234E01327b24a831e3718DBFcbE245904CC',
    CompoundComptroller: '0xb1983eE0064Fdb2A581966715DC9bA4D8B289A6A'
  },
  137: {
    Stablecoin: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063'
  }
}

export const PRIZE_POOL_TYPES = {
  compound: 'compound',
  genericYield: 'genericYield',
  stake: 'stake'
}

export const COMP_DECIMALS = 18
