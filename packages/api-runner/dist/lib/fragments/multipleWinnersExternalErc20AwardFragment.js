'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const multipleWinnersExternalErc20AwardFragment = gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  fragment multipleWinnersExternalErc20AwardFragment on MultipleWinnersExternalErc20Award {\n    id\n\n    address\n\n    name\n    symbol\n    decimals\n  }\n"])));

exports.multipleWinnersExternalErc20AwardFragment = multipleWinnersExternalErc20AwardFragment;
