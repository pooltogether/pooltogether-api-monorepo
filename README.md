# `PoolTogether API monorepo`

API calls are all GET requests and use the following structure:

https://pooltogether-api.com/pools/:chainId/:poolAddress

Example: the DAI pool's data would be:

https://pooltogether-api.com/pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a

## Instructions

#### Installation

1. `yarn global add @cloudflare/wrangler` and then log in `wrangler login`
2. In `packages/api-entrypoint` run: `cp wrangler.toml.example wrangler.toml` and fill out `account_id` inside wrangler.toml
3. In `packages/api-entrypoint` run: `yarn install`
4. In `packages/api-runner` run: `yarn install`

#### Development

1. In `packages/api-runner` run: `yarn link`
2. In `packages/api-entrypoint` run: `yarn link "@pooltogether/api-runner"`
3. In `packages/api-entrypoint` run: `yarn start`
4. API is available at `http://127.0.0.1:8787/`

#### Development (alternative)

Errors displayed from the entry point aren't the most useful - running in an isolated node environment gives you some more details!

1. To run in dev mode, `cd packages/api-entrypoint` and run: `yarn start`
2. To publish to production, `cd packages/api-entrypoint` and run `yarn publish`
3. To test the functionality:

- `cd packages/api-runner`
- `yarn build`
- `node`
- `const { pool, pools } = require( './dist/index')`
- `pool({ url: 'https://example.com/pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json' })`

#### Publishing

1. In `packages/api-runner` run: `yarn build && yarn publish`
2. Ensure `zone_id` and `route` are configured in `packages/api-entrypoint/wrangler.toml`
3. In `packages/api-entrypoint` run: `wrangler publish`

##### TODO:

- handle requests using various services / cloudflare, alchemy, infura, etc
- allow querying other networks such polygon, bsc, rinkeby, etc
- support any pool address
- historical data querying based on a specific block number
- write documentation on docs.pooltogether.com
