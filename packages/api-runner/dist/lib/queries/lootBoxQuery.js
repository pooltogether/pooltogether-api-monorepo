'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');
var lootBoxFragment = require('../fragments/lootBoxFragment.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const lootBoxQuery = number => {
  let blockFilter = '';

  if (number > 0) {
    blockFilter = ", block: { number: ".concat(number, " }");
  }

  return gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n    query lootBoxQuery($lootBoxAddress: ID!, $tokenIds: [String]!) {\n      lootBoxes(\n        where: {\n          erc721: $lootBoxAddress, # '0x2cb260f1313454386262373773124f6bc912cf28'\n          tokenId_in: $tokenIds # '[1, 2] or [1]',\n        } ", "\n      ) {\n        ...lootBoxFragment\n      }\n    }\n    ", "\n  "])), blockFilter, lootBoxFragment.lootBoxFragment);
};

exports.lootBoxQuery = lootBoxQuery;
