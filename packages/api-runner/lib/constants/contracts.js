import { contractAddresses } from '@pooltogether/current-pool-data'

export const CONTRACT_ADDRESSES = Object.freeze(contractAddresses)

/**
 * Each pool must be in the format:
 *
 * {
 *    prizePool: {
 *      address: String
 *    },
 *    symbol: string
 *    subgraphVersion: string
 * }
 *
 */
export const PRIZE_POOL_CONTRACTS = Object.freeze({
  1: {
    governance: [
      {
        prizePool: {
          address: contractAddresses[1].dai?.prizePool?.toLowerCase()
        },
        symbol: 'PT-cDAI',
        subgraphVersion: '3.1.0'
      },
      {
        prizePool: {
          address: contractAddresses[1].uni?.prizePool?.toLowerCase()
        },
        symbol: 'PT-cUNI',
        subgraphVersion: '3.1.0'
      },
      {
        prizePool: {
          address: contractAddresses[1].usdc?.prizePool?.toLowerCase()
        },
        symbol: 'PT-cUSDC',
        subgraphVersion: '3.1.0'
      },
      {
        prizePool: {
          address: contractAddresses[1].pool?.prizePool?.toLowerCase()
        },
        symbol: 'PT-stPOOL',
        subgraphVersion: '3.3.2'
      },
      {
        prizePool: {
          address: contractAddresses[1].comp?.prizePool?.toLowerCase()
        },
        symbol: 'PT-cCOMPs',
        subgraphVersion: '3.1.0'
      }
    ],
    community: [
      {
        prizePool: { address: '0xa88ca010b32a54d446fc38091ddbca55750cbfc3' },
        symbol: 'WETH-0xa88ca0',
        subgraphVersion: '3.3.2'
      },
      {
        prizePool: { address: '0xea7eaecbff99ce2412e794437325f3bd225ee78f' },
        symbol: 'BOND-0xea7eae',
        subgraphVersion: '3.1.0'
      },
      {
        prizePool: { address: '0xdf19f2f606dcc5849199594e77058898a7caa73d' },
        symbol: 'ZRX-0xdf19f2',
        subgraphVersion: '3.1.0'
      },
      {
        prizePool: { address: '0x639d4140a1f7723b7cefef7505d1d7be11a43de0' },
        symbol: 'UNI-V2-0x639d41',
        subgraphVersion: '3.1.0'
      },
      {
        prizePool: { address: '0x481f1ba81f7c01400831dff18215961c3530d118' },
        symbol: 'USDT-0x481f1B',
        subgraphVersion: '3.3.8'
      },
      {
        prizePool: { address: '0x9f7905c7bd5ec9e870ed50f0e286f2742c19f5b3' },
        symbol: 'DPI-0x9f7905',
        subgraphVersion: '3.1.0'
      }
    ]
  },
  4: {
    governance: [
      {
        prizePool: {
          address: contractAddresses[4].dai?.prizePool?.toLowerCase()
        },
        symbol: 'PT-cDAI',
        subgraphVersion: '3.1.0'
      },
      {
        prizePool: {
          address: contractAddresses[4].bat?.prizePool?.toLowerCase()
        },
        symbol: 'PT-cBAT',
        subgraphVersion: '3.1.0'
      }
    ],
    community: [
      {
        prizePool: { address: '0x95bca36b53ab0c54b162672454fe4be869a6f9ca' },
        symbol: 'USDC-0x95bca3',
        subgraphVersion: '3.3.2'
      },
      {
        prizePool: { address: '0xc8e1ea1afb7361cd647ad1a54a6c074f1174eb6e' },
        symbol: 'BAT-0xc8e1ea',
        subgraphVersion: '3.3.2'
      }
    ]
  },
  137: {
    governance: [],
    community: [
      {
        prizePool: { address: '0x60764c6be24ddab70d9ae1dbf7436533cc073c21' },
        symbol: 'DAI-0x60764c',
        subgraphVersion: '3.3.0'
      }
    ]
  }
})
