import TokenFaucetProxyFactoryMainnet from '@pooltogether/pooltogether-contracts/deployments/mainnet/TokenFaucetProxyFactory.json'

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
    TokenFaucetProxyFactory: TokenFaucetProxyFactoryMainnet.address,
    MerkleDistributor: '0xBE1a33519F586A4c8AA37525163Df8d67997016f',
    GovernanceToken: '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e',
    Sablier: '0xA4fc358455Febe425536fd1878bE67FfDBDEC59a'
  }
}

export const PRIZE_POOL_TYPES = {
  compound: 'compound',
  genericYield: 'genericYield',
  stake: 'stake'
}
