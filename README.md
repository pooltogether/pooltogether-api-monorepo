# `PoolTogether API monorepo`

API calls are all GET requests and use the following structure:

https://pooltogether-api.com/pools/:chainId/:poolAddress

Example: the DAI pool's data would be:

https://pooltogether-api.com/pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a

## Architecture

[Architecture overview](https://miro.com/app/board/o9J_l8uMoQg=/)

![Architecture overview](architecture-overview.png)

## Instructions

#### Installation

1. `yarn global add @cloudflare/wrangler` and then log in `wrangler login`

#### Setup

For each of the workers in [packages](./packages), you will need to:

1. run: `cp wrangler.toml.example wrangler.toml` and fill out `account_id` & Sentry variables inside wrangler.toml
2. run: `yarn`

#### Development ([pool-updater](./packages/api-pool-updater/README.md))

1. In `packages/api-runner` run: `yarn link`
2. In `packages/api-pool-updater` run: `yarn link "@pooltogether/api-runner"`
3. In `packages/api-runner` run: `yarn build`
4. In `packages/api-pool-updater` run: `yarn start`
5. API is available at `http://127.0.0.1:8787/update`

Updated values will be reflected in the development KV on Cloudflare.

#### Development ([entrypoint](./packages/api-entrypoint/README.md))

1. In `packages/api-entrypoint` run: `yarn dev-prod`
2. API is available at `http://127.0.0.1:8787/`

#### Development ([api-runner](./packages/api-runner/README.md))

It's handy to be able to run it in the node REPL, as the Cloudflare worker environment is Rust emulating JS which proves difficult for debugging.

It's set up to be identical to the other libraries we create and use, being built independently with Rollup and then consumed by the pool updater.

1. To run in dev mode, `cd packages/api-entrypoint` and run: `yarn start`
2. To publish to production, `cd packages/api-entrypoint` and run `wrangler publish`
3. To test the functionality:

- `cd packages/api-runner`
- `yarn build`
- `node`
- `const { pool, pools } = require( './dist/index')`
- `pool({ url: 'https://example.com/pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a.json' })`

#### Publishing

- [Publishing @pooltogether/api-runner](./packages/api-runner/README.md)
- [Publishing API Entry point](./packages/api-entrypoint/README.md#deploying)
- [Publishing Pool Updaters](./packages/api-pool-updater/README.md#deploying-a-single-network)
- [Publishing Yield Source Data](./packages/api-pool-updater/README.md#deploying)

##### TODO:

- handle requests using various services / cloudflare, alchemy, infura, etc
- allow querying other networks such polygon, bsc, rinkeby, etc
- support any pool address
- historical data querying based on a specific block number
- write documentation on docs.pooltogether.com
