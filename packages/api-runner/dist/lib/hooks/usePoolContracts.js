'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var currentPoolData = require('@pooltogether/current-pool-data');

function usePoolContracts(chainId) {
  return [...currentPoolData.prizePoolContracts[chainId].governance, ...currentPoolData.prizePoolContracts[chainId].community.map(contract => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, contract), {}, {
    isCommunityPool: true
  }))];
}
function usePoolContract(chainId, poolAddress) {
  const poolContracts = usePoolContracts(chainId);
  return poolContracts.find(contract => contract.prizePool.address.toLowerCase() === poolAddress.toLowerCase());
}

exports.usePoolContract = usePoolContract;
exports.usePoolContracts = usePoolContracts;
