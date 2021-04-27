'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var currentPoolData = require('@pooltogether/current-pool-data');

const ERC20_BLOCK_LIST = currentPoolData.tokenBlockList;
const SECONDS_PER_DAY = 86400;
const DEFAULT_TOKEN_PRECISION = 18;
const CUSTOM_CONTRACT_ADDRESSES = {
  1: {
    Usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    Sablier: '0xA4fc358455Febe425536fd1878bE67FfDBDEC59a'
  },
  4: {
    Usdt: '0x3b00ef435fa4fcff5c209a37d1f3dcff37c705ad',
    Sablier: '0xc04Ad234E01327b24a831e3718DBFcbE245904CC'
  }
};
const PRIZE_POOL_TYPES = {
  compound: 'compound',
  genericYield: 'genericYield',
  stake: 'stake'
};

exports.CUSTOM_CONTRACT_ADDRESSES = CUSTOM_CONTRACT_ADDRESSES;
exports.DEFAULT_TOKEN_PRECISION = DEFAULT_TOKEN_PRECISION;
exports.ERC20_BLOCK_LIST = ERC20_BLOCK_LIST;
exports.PRIZE_POOL_TYPES = PRIZE_POOL_TYPES;
exports.SECONDS_PER_DAY = SECONDS_PER_DAY;
