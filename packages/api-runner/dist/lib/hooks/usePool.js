'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var usePoolContracts = require('./usePoolContracts.js');
var getPools = require('../fetchers/getPools.js');

/**
 *
 * @param {*} poolAddress
 * @returns
 */

const usePoolByAddress = async (chainId, poolAddress, fetch) => {
  const poolContract = await usePoolContracts.usePoolContract(chainId, poolAddress);
  return await usePool(chainId, poolContract, fetch);
};
/**
 *
 * @param {*} label
 * @returns
 */

const usePool = async (chainId, poolContract, fetch) => {
  const usePoolData = await usePools(chainId, [poolContract], fetch);
  return usePoolData === null || usePoolData === void 0 ? void 0 : usePoolData[0];
};
/**
 *
 * @param {*} poolContracts
 * @returns
 */


const usePools = async (chainId, poolContracts, fetch) => {
  const contracts = poolContracts.filter(Boolean);
  const pools = await getPools.getPools(chainId, contracts, fetch);
  return pools;
};

exports.usePoolByAddress = usePoolByAddress;
exports.usePools = usePools;
