'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');
var multipleWinnersFragment = require('./multipleWinnersFragment.js');
var singleRandomWinnerFragment = require('./singleRandomWinnerFragment.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const prizeStrategyFragment = gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  fragment prizeStrategyFragment on PrizeStrategy {\n    id\n\n    singleRandomWinner {\n      ...singleRandomWinnerFragment\n    }\n    multipleWinners {\n      ...multipleWinnersFragment\n    }\n  }\n  ", "\n  ", "\n"])), singleRandomWinnerFragment.singleRandomWinnerFragment, multipleWinnersFragment.multipleWinnersFragment);

exports.prizeStrategyFragment = prizeStrategyFragment;
