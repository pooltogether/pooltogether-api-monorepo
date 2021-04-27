'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var currentPoolData = require('@pooltogether/current-pool-data');

var _contractAddresses$1$, _contractAddresses$1$2, _contractAddresses$1$3, _contractAddresses$1$4, _contractAddresses$1$5, _contractAddresses$1$6, _contractAddresses$1$7, _contractAddresses$1$8, _contractAddresses$1$9, _contractAddresses$1$10, _contractAddresses$4$, _contractAddresses$4$2, _contractAddresses$4$3, _contractAddresses$4$4;
const CONTRACT_ADDRESSES = Object.freeze(currentPoolData.contractAddresses);
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

const PRIZE_POOL_CONTRACTS = Object.freeze({
  1: {
    governance: [{
      prizePool: {
        address: (_contractAddresses$1$ = currentPoolData.contractAddresses[1].dai) === null || _contractAddresses$1$ === void 0 ? void 0 : (_contractAddresses$1$2 = _contractAddresses$1$.prizePool) === null || _contractAddresses$1$2 === void 0 ? void 0 : _contractAddresses$1$2.toLowerCase()
      },
      symbol: 'PT-cDAI',
      subgraphVersion: '3.1.0'
    }, {
      prizePool: {
        address: (_contractAddresses$1$3 = currentPoolData.contractAddresses[1].uni) === null || _contractAddresses$1$3 === void 0 ? void 0 : (_contractAddresses$1$4 = _contractAddresses$1$3.prizePool) === null || _contractAddresses$1$4 === void 0 ? void 0 : _contractAddresses$1$4.toLowerCase()
      },
      symbol: 'PT-cUNI',
      subgraphVersion: '3.1.0'
    }, {
      prizePool: {
        address: (_contractAddresses$1$5 = currentPoolData.contractAddresses[1].usdc) === null || _contractAddresses$1$5 === void 0 ? void 0 : (_contractAddresses$1$6 = _contractAddresses$1$5.prizePool) === null || _contractAddresses$1$6 === void 0 ? void 0 : _contractAddresses$1$6.toLowerCase()
      },
      symbol: 'PT-cUSDC',
      subgraphVersion: '3.1.0'
    }, {
      prizePool: {
        address: (_contractAddresses$1$7 = currentPoolData.contractAddresses[1].pool) === null || _contractAddresses$1$7 === void 0 ? void 0 : (_contractAddresses$1$8 = _contractAddresses$1$7.prizePool) === null || _contractAddresses$1$8 === void 0 ? void 0 : _contractAddresses$1$8.toLowerCase()
      },
      symbol: 'PT-stPOOL',
      subgraphVersion: '3.3.2'
    }, {
      prizePool: {
        address: (_contractAddresses$1$9 = currentPoolData.contractAddresses[1].comp) === null || _contractAddresses$1$9 === void 0 ? void 0 : (_contractAddresses$1$10 = _contractAddresses$1$9.prizePool) === null || _contractAddresses$1$10 === void 0 ? void 0 : _contractAddresses$1$10.toLowerCase()
      },
      symbol: 'PT-cCOMPs',
      subgraphVersion: '3.1.0'
    }],
    community: [{
      prizePool: {
        address: '0xa88ca010b32a54d446fc38091ddbca55750cbfc3'
      },
      symbol: 'WETH-0xa88ca0',
      subgraphVersion: '3.3.2'
    }, {
      prizePool: {
        address: '0xea7eaecbff99ce2412e794437325f3bd225ee78f'
      },
      symbol: 'BOND-0xea7eae',
      subgraphVersion: '3.1.0'
    }, {
      prizePool: {
        address: '0xdf19f2f606dcc5849199594e77058898a7caa73d'
      },
      symbol: 'ZRX-0xdf19f2',
      subgraphVersion: '3.1.0'
    }, {
      prizePool: {
        address: '0x639d4140a1f7723b7cefef7505d1d7be11a43de0'
      },
      symbol: 'UNI-V2-0x639d41',
      subgraphVersion: '3.1.0'
    }, {
      prizePool: {
        address: '0x481f1ba81f7c01400831dff18215961c3530d118'
      },
      symbol: 'USDT-0x481f1B',
      subgraphVersion: '3.3.8'
    }, {
      prizePool: {
        address: '0x9f7905c7bd5ec9e870ed50f0e286f2742c19f5b3'
      },
      symbol: 'DPI-0x9f7905',
      subgraphVersion: '3.1.0'
    }]
  },
  4: {
    governance: [{
      prizePool: {
        address: (_contractAddresses$4$ = currentPoolData.contractAddresses[4].dai) === null || _contractAddresses$4$ === void 0 ? void 0 : (_contractAddresses$4$2 = _contractAddresses$4$.prizePool) === null || _contractAddresses$4$2 === void 0 ? void 0 : _contractAddresses$4$2.toLowerCase()
      },
      symbol: 'PT-cDAI',
      subgraphVersion: '3.1.0'
    }, {
      prizePool: {
        address: (_contractAddresses$4$3 = currentPoolData.contractAddresses[4].bat) === null || _contractAddresses$4$3 === void 0 ? void 0 : (_contractAddresses$4$4 = _contractAddresses$4$3.prizePool) === null || _contractAddresses$4$4 === void 0 ? void 0 : _contractAddresses$4$4.toLowerCase()
      },
      symbol: 'PT-cBAT',
      subgraphVersion: '3.1.0'
    }],
    community: [{
      prizePool: {
        address: '0x95bca36b53ab0c54b162672454fe4be869a6f9ca'
      },
      symbol: 'USDC-0x95bca3',
      subgraphVersion: '3.3.2'
    }, {
      prizePool: {
        address: '0xc8e1ea1afb7361cd647ad1a54a6c074f1174eb6e'
      },
      symbol: 'BAT-0xc8e1ea',
      subgraphVersion: '3.3.2'
    }]
  },
  137: {
    governance: [],
    community: [{
      prizePool: {
        address: '0x60764c6be24ddab70d9ae1dbf7436533cc073c21'
      },
      symbol: 'DAI-0x60764c',
      subgraphVersion: '3.3.0'
    }]
  }
});

exports.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
exports.PRIZE_POOL_CONTRACTS = PRIZE_POOL_CONTRACTS;
