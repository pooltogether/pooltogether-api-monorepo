// TODO: Block list for erc20's const MY_CRYPTO_MEMBERSHIP_ADDRESS = '0x6ca105d2af7095b1bceeb6a2113d168dddcd57cf'
export const ERC20_BLOCK_LIST = ['0x6ca105d2af7095b1bceeb6a2113d168dddcd57cf']

export const SECONDS_PER_BLOCK = 14

export const SECONDS_PER_WEEK = 604800
export const SECONDS_PER_DAY = 86400
export const SECONDS_PER_HOUR = 3600

export const DEFAULT_TOKEN_PRECISION = 18

export const ETHEREUM_NETWORKS = [1, 3, 4, 5, 42]

export const CUSTOM_CONTRACT_ADDRESSES = {
  1: {
    Usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    Sablier: '0xA4fc358455Febe425536fd1878bE67FfDBDEC59a'
  },
  4: {
    Usdt: '0x3b00ef435fa4fcff5c209a37d1f3dcff37c705ad',
    Sablier: '0xc04Ad234E01327b24a831e3718DBFcbE245904CC'
  }
}

export const PRIZE_POOL_TYPES = {
  compound: 'compound',
  genericYield: 'genericYield',
  stake: 'stake'
}
