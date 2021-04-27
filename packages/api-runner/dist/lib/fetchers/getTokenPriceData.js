'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var graphqlRequest = require('graphql-request');
var constants = require('../constants.js');
var useSubgraphClients = require('../hooks/useSubgraphClients.js');

var _templateObject;
const QUERY_TEMPLATE = "token__num__: tokens(where: { id: \"__address__\" } __blockFilter__) {\n  id\n  derivedETH\n}";

const _addStablecoin = (addresses, usdtAddress) => {
  const usdt = addresses.find(address => usdtAddress === address);

  if (!usdt) {
    addresses.splice(0, 0, usdtAddress);
  }

  return addresses;
};

const _getBlockFilter = blockNumber => {
  let blockFilter = '';

  if (blockNumber > 0) {
    blockFilter = ", block: { number: ".concat(blockNumber, " }");
  }

  return blockFilter;
};

const _calculateUsd = token => {
  let derivedETH = token === null || token === void 0 ? void 0 : token.derivedETH;

  if (!derivedETH || derivedETH === '0') {
    derivedETH = 0.2; // 1 ETH is $5 USD, used for Rinkeby, etc
  }

  return 1 / derivedETH;
};

const getTokenPriceData = async (chainId, addresses, fetch, blockNumber = -1) => {
  var _CUSTOM_CONTRACT_ADDR;

  // Only supported on mainnet
  if (chainId !== 1) {
    return {};
  }

  const blockFilter = _getBlockFilter(blockNumber);

  const graphQLClient = useSubgraphClients.getUniswapSubgraphClient(chainId, fetch); // We'll use this stablecoin to measure the price of ETH off of

  const stablecoinAddress = (_CUSTOM_CONTRACT_ADDR = constants.CUSTOM_CONTRACT_ADDRESSES[chainId]) === null || _CUSTOM_CONTRACT_ADDR === void 0 ? void 0 : _CUSTOM_CONTRACT_ADDR['Usdt'];

  _addStablecoin(addresses, stablecoinAddress); // build a query selection set from all the token addresses


  let query = "";

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const selection = QUERY_TEMPLATE.replace('__num__', i).replace('__address__', address).replace('__blockFilter__', blockFilter);
    query = "".concat(query, "\n").concat(selection);
  }

  const response = await graphQLClient.request(graphqlRequest.gql(_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  query uniswapTokensQuery {\n    ", "\n  }\n"])), query)); // unpack the data into a useful object

  let data = {};

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const token = response["token".concat(i)][0];
    data[address] = token;
  } // calculate and cache the price of eth in the data object


  data['ethereum'] = {
    derivedETH: '1',
    id: 'eth',
    usd: _calculateUsd(data[stablecoinAddress])
  }; // calculate the price of the token in USD

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const token = data[address];

    if (token) {
      data[address] = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, token), {}, {
        usd: data['ethereum'].usd * parseFloat(token.derivedETH)
      });
    }
  }

  return data;
};

exports.getTokenPriceData = getTokenPriceData;
