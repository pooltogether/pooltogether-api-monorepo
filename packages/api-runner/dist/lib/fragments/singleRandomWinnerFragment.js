'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');
var controlledTokenFragment = require('./controlledTokenFragment.js');
var singleRandomWinnerExternalErc20AwardFragment = require('./singleRandomWinnerExternalErc20AwardFragment.js');
var singleRandomWinnerExternalErc721AwardFragment = require('./singleRandomWinnerExternalErc721AwardFragment.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const singleRandomWinnerFragment = gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  fragment singleRandomWinnerFragment on SingleRandomWinnerPrizeStrategy {\n    id\n\n    prizePeriodSeconds\n    tokenListener\n\n    ticket {\n      ...controlledTokenFragment\n    }\n    sponsorship {\n      ...controlledTokenFragment\n    }\n    externalErc20Awards {\n      ...singleRandomWinnerExternalErc20AwardFragment\n    }\n    externalErc721Awards {\n      ...singleRandomWinnerExternalErc721AwardFragment\n    }\n  }\n  ", "\n  ", "\n  ", "\n"])), controlledTokenFragment.controlledTokenFragment, singleRandomWinnerExternalErc20AwardFragment.singleRandomWinnerExternalErc20AwardFragment, singleRandomWinnerExternalErc721AwardFragment.singleRandomWinnerExternalErc721AwardFragment);

exports.singleRandomWinnerFragment = singleRandomWinnerFragment;
