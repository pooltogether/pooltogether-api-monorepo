'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const erc1155BalanceFragment = gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  fragment erc1155BalanceFragment on ERC1155Balance {\n    id\n    balance\n    tokenId\n\n    erc1155Entity {\n      id\n    }\n  }\n"])));

exports.erc1155BalanceFragment = erc1155BalanceFragment;
