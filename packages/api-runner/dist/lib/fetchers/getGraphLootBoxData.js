'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var currentPoolData = require('@pooltogether/current-pool-data');
var useSubgraphClients = require('../hooks/useSubgraphClients.js');
var lootBoxQuery = require('../queries/lootBoxQuery.js');

const getGraphLootBoxData = async (chainId, tokenIds, fetch) => {
  var _contractAddresses$ch, _contractAddresses$ch2;

  if (tokenIds.length === 0) return [];
  const graphQLClient = useSubgraphClients.getLootBoxSubgraphClient(chainId, fetch);
  const lootBoxAddress = (_contractAddresses$ch = currentPoolData.contractAddresses[chainId]) === null || _contractAddresses$ch === void 0 ? void 0 : (_contractAddresses$ch2 = _contractAddresses$ch.lootBox) === null || _contractAddresses$ch2 === void 0 ? void 0 : _contractAddresses$ch2.toLowerCase();
  const variables = {
    lootBoxAddress,
    tokenIds
  };
  const query = lootBoxQuery.lootBoxQuery();

  try {
    const response = await graphQLClient.request(query, variables);
    return response;
  } catch (error) {
    console.error(error);
    return [];
  }
};

exports.getGraphLootBoxData = getGraphLootBoxData;
