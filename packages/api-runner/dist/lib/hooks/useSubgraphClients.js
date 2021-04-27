'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var graphqlRequest = require('graphql-request');
var subgraphUris = require('../constants/subgraphUris.js');

const getSubgraphVersionsFromContracts = poolContracts => [...new Set(poolContracts.map(pool => pool.subgraphVersion))];
const getUniswapSubgraphClient = (chainId, fetch) => new graphqlRequest.GraphQLClient(subgraphUris.UNISWAP_GRAPH_URIS[chainId], {
  fetch
});
const getSubgraphClientsByVersionFromContracts = (poolContracts, chainId, fetch) => getSubgraphVersionsFromContracts(poolContracts).reduce((accumulator, version) => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, accumulator), {}, {
  [version]: new graphqlRequest.GraphQLClient(subgraphUris.POOLTOGETHER_SUBGRAPHS[chainId][version], {
    fetch
  })
}), {});
const getPoolAddressesBySubgraphVersionFromContracts = poolContracts => {
  return poolContracts.reduce((accumulator, pool) => {
    return _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, accumulator), {}, {
      [pool.subgraphVersion]: [].concat(pool.prizePool.address, accumulator !== null && accumulator !== void 0 && accumulator[pool.subgraphVersion] ? accumulator[pool.subgraphVersion] : [])
    });
  }, {});
};
const getLootBoxSubgraphClient = (chainId, fetch) => new graphqlRequest.GraphQLClient(subgraphUris.LOOTBOX_GRAPH_URIS[chainId], {
  fetch
});

exports.getLootBoxSubgraphClient = getLootBoxSubgraphClient;
exports.getPoolAddressesBySubgraphVersionFromContracts = getPoolAddressesBySubgraphVersionFromContracts;
exports.getSubgraphClientsByVersionFromContracts = getSubgraphClientsByVersionFromContracts;
exports.getSubgraphVersionsFromContracts = getSubgraphVersionsFromContracts;
exports.getUniswapSubgraphClient = getUniswapSubgraphClient;
