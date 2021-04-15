# `PoolTogether API monorepo`

API calls are all GET requests and use the following structure:

https://pooltogether-api.com/pools/:chainId/:poolAddress

Example: the DAI pool's data would be:

https://pooltogether-api.com/pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a

### Instructions

Currently there are two main packages: `packages/api-entrypoint` and `packages/api-runner`. You will need to run `yarn install` in each of them. Following that:

1. To run in dev mode, `cd packages/api-entrypoint` and run: `yarn start`

2. To publish to production, `cd packages/api-entrypoint` and run `yarn publish`

3. To test the functionality:

- `cd packages/api-runner`
- `yarn build`
- `node`
- `const { pool, pools } = require( './dist/index')`
- `pool({ url: 'https://example.com/pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json' })`

##### TODO:

- handle requests using various services / cloudflare, alchemy, infura, etc
