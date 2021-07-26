# `Pooltogether API - Runner`

This library allows you to run the API locally for debugging via the node.js `node` enviroment, as well as be included in other packages (such as the Cloudflare Worker `api-entrypoint`).

## Development

1. `setInfuraId(INFURA_ID)`
2. `setFetch(fetch)`
3. `getPools(1)`

## Local Testing

1. `node`
2. `const { getPools, setInfuraId } = require( './dist/index')`
3. `setInfuraId(YOUR_INFURA_ID)`
4. `getPools(chainId)`
