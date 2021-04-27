'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');
var prizeStrategyFragment = require('./prizeStrategyFragment.js');
require('./prizePoolAccountFragment.js');
var controlledTokenFragment = require('./controlledTokenFragment.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const prizePoolFragment = gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  fragment prizePoolFragment on PrizePool {\n    id\n\n    prizeStrategy {\n      ...prizeStrategyFragment\n    }\n\n    compoundPrizePool {\n      id\n      cToken\n    }\n\n    stakePrizePool {\n      id\n      stakeToken\n    }\n\n    yieldSourcePrizePool {\n      id\n      yieldSource\n    }\n\n    sablierStream {\n      id\n    }\n\n    underlyingCollateralToken\n    underlyingCollateralDecimals\n    underlyingCollateralName\n    underlyingCollateralSymbol\n\n    maxExitFeeMantissa\n    maxTimelockDuration\n    timelockTotalSupply\n    liquidityCap\n\n    reserveRegistry\n\n    cumulativePrizeNet\n\n    currentPrizeId\n    currentState\n\n    tokenCreditRates {\n      id\n      creditRateMantissa\n      creditLimitMantissa\n    }\n  }\n  ", "\n\n  ", "\n"])), prizeStrategyFragment.prizeStrategyFragment, controlledTokenFragment.controlledTokenFragment); // ${prizePoolAccountFragment}

exports.prizePoolFragment = prizePoolFragment;
