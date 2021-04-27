'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const POOLTOGETHER_SUBGRAPHS = {
  1: {
    '3.1.0': 'https://api.thegraph.com/subgraphs/name/pooltogether/pooltogether-v3_1_0',
    '3.3.2': 'https://api.thegraph.com/subgraphs/name/pooltogether/pooltogether-v3_3_2',
    '3.3.8': 'https://api.thegraph.com/subgraphs/name/pooltogether/pooltogether-v3_3_8'
  },
  3: {
    '3.1.0': 'https://api.thegraph.com/subgraphs/name/pooltogether/ropsten-v3'
  },
  4: {
    '3.1.0': 'https://api.thegraph.com/subgraphs/name/pooltogether/rinkeby-staging-v3_1_0',
    '3.3.2': 'https://api.thegraph.com/subgraphs/name/pooltogether/rinkeby-v3_3_2',
    '3.3.8': 'https://api.thegraph.com/subgraphs/name/pooltogether/rinkeby-v3_3_8'
  },
  137: {
    '3.3.0': 'https://api.thegraph.com/subgraphs/name/pooltogether/pooltogether-polygon-v3_3'
  }
};
const LOOTBOX_GRAPH_URIS = {
  1: 'https://api.thegraph.com/subgraphs/name/pooltogether/lootbox-v1_0_0',
  3: '',
  4: 'https://api.thegraph.com/subgraphs/name/pooltogether/ptv3-lootbox-rinkeby-staging'
};
const UNISWAP_GRAPH_URIS = {
  1: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
  4: 'https://api.thegraph.com/subgraphs/name/blockrockettech/uniswap-v2-subgraph-rinkeby',
  137: 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap'
};

exports.LOOTBOX_GRAPH_URIS = LOOTBOX_GRAPH_URIS;
exports.POOLTOGETHER_SUBGRAPHS = POOLTOGETHER_SUBGRAPHS;
exports.UNISWAP_GRAPH_URIS = UNISWAP_GRAPH_URIS;
