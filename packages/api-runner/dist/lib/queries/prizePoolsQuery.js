'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');
var prizePoolFragment = require('../fragments/prizePoolFragment.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const prizePoolsQuery = (number = -1) => {
  const blockFilter = number > 0 ? ", block: { number: ".concat(number, " }") : '';
  return gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n    query prizePoolsQuery($poolAddresses: [String!]!) {\n      prizePools(where: { id_in: $poolAddresses } ", ") {\n        ...prizePoolFragment\n      }\n    }\n    ", "\n  "])), blockFilter, prizePoolFragment.prizePoolFragment);
};

exports.prizePoolsQuery = prizePoolsQuery;
