/**
 * Constant for chain ids
 */
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
  'polygon': 137,
  'matic': 137,
  'optimism': 10,
  'avalanche': 43114,
  'fuji': 43113,
  'celo': 42220,
  'celo-testnet': 44787,
  'mumbai': 80001
})

/**
 * Full Chain objects
 * NOTE: This is just copy pasta output from @pooltogether/wallet-connection
 */
export const ALL_CHAINS = Object.freeze([
  {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3'],
    blockExplorers: [
      {
        name: 'Etherscan',
        url: 'https://etherscan.io'
      }
    ]
  },
  {
    id: 3,
    name: 'Ropsten',
    nativeCurrency: {
      name: 'Ropsten Ether',
      symbol: 'ropETH',
      decimals: 18
    },
    rpcUrls: ['https://ropsten.infura.io/v3'],
    blockExplorers: [
      {
        name: 'Etherscan',
        url: 'https://ropsten.etherscan.io'
      }
    ],
    testnet: true
  },
  {
    id: 4,
    name: 'Rinkeby',
    nativeCurrency: {
      name: 'Rinkeby Ether',
      symbol: 'rETH',
      decimals: 18
    },
    rpcUrls: ['https://rinkeby.infura.io/v3'],
    blockExplorers: [
      {
        name: 'Etherscan',
        url: 'https://rinkeby.etherscan.io'
      }
    ],
    testnet: true
  },
  {
    id: 100,
    name: 'xDai',
    nativeCurrency: {
      name: 'xDai',
      symbol: 'xDAI',
      decimals: 18
    },
    rpcUrls: ['https://rpc.gnosischain.com'],
    blockExplorers: [
      {
        name: 'Blockscout',
        url: 'https://blockscout.com'
      }
    ]
  },
  {
    id: 5,
    name: 'Goerli',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'gETH',
      decimals: 18
    },
    rpcUrls: ['https://goerli.infura.io/v3'],
    blockExplorers: [
      {
        name: 'Etherscan',
        url: 'https://goerli.etherscan.io'
      }
    ],
    testnet: true
  },
  {
    id: 42,
    name: 'Kovan',
    nativeCurrency: {
      name: 'Kovan Ether',
      symbol: 'kETH',
      decimals: 18
    },
    rpcUrls: ['https://kovan.infura.io/v3'],
    blockExplorers: [
      {
        name: 'Etherscan',
        url: 'https://kovan.etherscan.io'
      }
    ],
    testnet: true
  },
  {
    id: 10,
    name: 'Optimism',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorers: [
      {
        name: 'Etherscan',
        url: 'https://optimistic.etherscan.io'
      }
    ]
  },
  {
    id: 69,
    name: 'Optimism Kovan',
    nativeCurrency: {
      name: 'Kovan Ether',
      symbol: 'KOR',
      decimals: 18
    },
    rpcUrls: ['https://kovan.optimism.io'],
    blockExplorers: [
      {
        name: 'Etherscan',
        url: 'https://kovan-optimistic.etherscan.io'
      }
    ],
    testnet: true
  },
  {
    id: 137,
    name: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://rpc-mainnet.matic.network',
      'https://matic-mainnet.chainstacklabs.com',
      'https://rpc-mainnet.maticvigil.com',
      'https://rpc-mainnet.matic.quiknode.pro',
      'https://matic-mainnet-full-rpc.bwarelabs.com'
    ],
    blockExplorers: [
      {
        name: 'Polygonscan',
        url: 'https://polygonscan.com'
      }
    ]
  },
  {
    id: 80001,
    name: 'Mumbai',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: [
      'https://matic-mumbai.chainstacklabs.com',
      'https://rpc-mumbai.maticvigil.com',
      'https://matic-testnet-archive-rpc.bwarelabs.com'
    ],
    blockExplorers: [
      {
        name: 'Polygonscan',
        url: 'https://mumbai.polygonscan.com'
      }
    ],
    testnet: true
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'AETH',
      decimals: 18
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorers: [
      {
        name: 'Arbiscan',
        url: 'https://arbiscan.io'
      },
      {
        name: 'Arbitrum Explorer',
        url: 'https://explorer.arbitrum.io'
      }
    ]
  },
  {
    id: 421611,
    name: 'Arbitrum Rinkeby',
    nativeCurrency: {
      name: 'Arbitrum Rinkeby Ether',
      symbol: 'ARETH',
      decimals: 18
    },
    rpcUrls: ['https://rinkeby.arbitrum.io/rpc'],
    blockExplorers: [
      {
        name: 'Arbitrum Explorer',
        url: 'https://rinkeby-explorer.arbitrum.io'
      }
    ],
    testnet: true
  },
  {
    id: 43114,
    name: 'Avalanche',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorers: [
      {
        name: 'SnowTrace',
        url: 'https://snowtrace.io'
      }
    ],
    testnet: false
  },
  {
    id: 43113,
    name: 'Fuji',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    blockExplorers: [
      {
        name: 'SnowTrace',
        url: 'https://testnet.snowtrace.io'
      }
    ],
    testnet: true
  },
  {
    id: 1337,
    name: 'Localhost',
    rpcUrls: ['https://127.0.0.1:8545']
  },
  {
    id: 31337,
    name: 'Hardhat',
    rpcUrls: ['http://127.0.0.1:8545']
  },
  {
    id: 44787,
    name: 'Celo Alfajores Testnet',
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18
    },
    rpcUrls: [
      'https://alfajores-forno.celo-testnet.org',
      'wss://alfajores-forno.celo-testnet.org/ws'
    ],
    blockExplorers: [
      {
        name: 'BlockScout',
        url: 'https://alfajores-blockscout.celo-testnet.org/'
      }
    ],
    testnet: true
  },
  {
    id: 42220,
    name: 'Celo',
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18
    },
    rpcUrls: ['https://forno.celo.org'],
    blockExplorers: [
      {
        name: 'Celo Explorer',
        url: 'https://explorer.celo.org/'
      }
    ],
    testnet: false
  },
  {
    id: 56,
    name: 'Binance Smart Chain',
    nativeCurrency: {
      decimals: 18,
      name: 'Binance Chain Native Token',
      symbol: 'BNB'
    },
    rpcUrls: [
      'https://bsc-dataseed.binance.org/',
      'https://bsc-dataseed1.defibit.io/',
      'https://bsc-dataseed1.ninicoin.io/'
    ],
    blockExplorers: [
      {
        name: 'Bscscan',
        url: 'https://bscscan.com'
      }
    ]
  }
])
