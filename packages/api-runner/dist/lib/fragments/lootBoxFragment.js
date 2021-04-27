'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');
var erc20BalanceFragment = require('./erc20BalanceFragment.js');
var erc721TokenFragment = require('./erc721TokenFragment.js');
var erc1155BalanceFragment = require('./erc1155BalanceFragment.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const lootBoxFragment = gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  fragment lootBoxFragment on LootBox {\n    id\n    erc721\n    tokenId\n\n    erc20Balances {\n      ...erc20BalanceFragment\n    }\n\n    erc721Tokens {\n      ...erc721TokenFragment\n    }\n\n    erc1155Balances {\n      ...erc1155BalanceFragment\n    }\n  }\n  ", "\n  ", "\n  ", "\n"])), erc20BalanceFragment.erc20BalanceFragment, erc721TokenFragment.erc721TokenFragment, erc1155BalanceFragment.erc1155BalanceFragment);

exports.lootBoxFragment = lootBoxFragment;
