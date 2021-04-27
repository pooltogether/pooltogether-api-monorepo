'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const erc721TokenFragment = gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  fragment erc721TokenFragment on ERC721Token {\n    id\n    tokenId\n\n    erc721Entity {\n      id\n      isLootBox\n      name\n      uri\n    }\n  }\n"])));

exports.erc721TokenFragment = erc721TokenFragment;
