'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const singleRandomWinnerExternalErc721AwardFragment = gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  fragment singleRandomWinnerExternalErc721AwardFragment on SingleRandomWinnerExternalErc721Award {\n    id\n    address\n    tokenIds\n  }\n"])));

exports.singleRandomWinnerExternalErc721AwardFragment = singleRandomWinnerExternalErc721AwardFragment;
