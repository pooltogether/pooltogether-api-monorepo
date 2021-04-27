'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var usePool = require('./lib/hooks/usePool.js');
var usePoolContracts = require('./lib/hooks/usePoolContracts.js');

const nodeFetch = require('node-fetch');

function path(request) {
  const _url = new URL(request.url);

  const pathname = _url.pathname;
  return pathname;
}

async function pools(request, fetch = nodeFetch) {
  const pathname = path(request).split('.')[0];
  const chainId = parseInt(pathname.split('/')[2], 10);
  const poolContracts = usePoolContracts.usePoolContracts(chainId);
  const pools = await usePool.usePools(chainId, poolContracts, fetch);
  return pools;
}
async function pool(request, fetch = nodeFetch) {
  const pathname = path(request).split('.')[0];
  const chainId = parseInt(pathname.split('/')[2], 10);
  const poolAddress = pathname.split('/')[3];
  const pool = await usePool.usePoolByAddress(chainId, poolAddress, fetch);
  return pool;
}

exports.pool = pool;
exports.pools = pools;
