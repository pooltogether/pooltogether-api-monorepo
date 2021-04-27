'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const erc20BalanceFragment = gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  fragment erc20BalanceFragment on ERC20Balance {\n    id\n    balance\n\n    erc20Entity {\n      id\n      name\n      symbol\n      decimals\n    }\n  }\n"])));

exports.erc20BalanceFragment = erc20BalanceFragment;
