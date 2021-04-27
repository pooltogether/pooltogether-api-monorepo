'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../_virtual/_rollupPluginBabelHelpers.js');
var etherplex = require('@pooltogether/etherplex');

const RPC_URLS = {
  1: 'https://mainnet.infura.io/v3/a0a574aaa9fc4fa8ad117dc7bc6ffc19',
  // TODO: lock this app ID down
  4: 'https://rinkeby.infura.io/v3/a0a574aaa9fc4fa8ad117dc7bc6ffc19',
  137: 'https://rpc-mainnet.maticvigil.com/v1/c0d152023d5f8fa74422a77a0cb065e20260380b',
  80001: 'https://rpc-mumbai.maticvigil.com/v1/c0d152023d5f8fa74422a77a0cb065e20260380b'
};
const batch = async (chainId, fetch, ...batchCalls) => {
  // TODO: currently we assume any PoolTogether pool is on a network which supports multicall
  // so make sure to handle calls differently if the network doesn't support multicall!
  // (see Etherplex for calls fallback for non-multicall networks)
  const _encodeData = etherplex.encodeData(...batchCalls),
        _encodeData2 = _rollupPluginBabelHelpers.slicedToArray(_encodeData, 3),
        result = _encodeData2[0],
        calls = _encodeData2[1],
        data = _encodeData2[2];

  const tx = {
    params: [await etherplex.prepareTransaction(chainId, data), 'latest'],
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_call'
  };
  const callResponse = await fetch(RPC_URLS[chainId], {
    method: 'POST',
    body: JSON.stringify(tx),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const body = await callResponse.json();
  const decoded = etherplex.decodeData(result, calls, body.result);
  return decoded;
};

exports.batch = batch;
