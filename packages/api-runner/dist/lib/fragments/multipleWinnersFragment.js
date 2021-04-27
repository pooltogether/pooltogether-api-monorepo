'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _rollupPluginBabelHelpers = require('../../_virtual/_rollupPluginBabelHelpers.js');
var gql = require('graphql-tag');
var controlledTokenFragment = require('./controlledTokenFragment.js');
var multipleWinnersExternalErc20AwardFragment = require('./multipleWinnersExternalErc20AwardFragment.js');
var multipleWinnersExternalErc721AwardFragment = require('./multipleWinnersExternalErc721AwardFragment.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var gql__default = /*#__PURE__*/_interopDefaultLegacy(gql);

var _templateObject;
const multipleWinnersFragment = gql__default['default'](_templateObject || (_templateObject = _rollupPluginBabelHelpers.taggedTemplateLiteral(["\n  fragment multipleWinnersFragment on MultipleWinnersPrizeStrategy {\n    id\n\n    numberOfWinners\n    prizePeriodSeconds\n    tokenListener\n\n    ticket {\n      ...controlledTokenFragment\n    }\n    sponsorship {\n      ...controlledTokenFragment\n    }\n    externalErc20Awards {\n      ...multipleWinnersExternalErc20AwardFragment\n    }\n    externalErc721Awards {\n      ...multipleWinnersExternalErc721AwardFragment\n    }\n  }\n  ", "\n  ", "\n  ", "\n"])), controlledTokenFragment.controlledTokenFragment, multipleWinnersExternalErc20AwardFragment.multipleWinnersExternalErc20AwardFragment, multipleWinnersExternalErc721AwardFragment.multipleWinnersExternalErc721AwardFragment);

exports.multipleWinnersFragment = multipleWinnersFragment;
