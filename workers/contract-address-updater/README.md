# `Pooltogether API - Contract Address Updater`

This repo contains a Cloudflare Worker that is triggered by a cron job to keep the data in a Cloudflare KV store up to date. The worker also exposes `/update` which allows a manual trigger of the update.

This worker traverses a tree of function calls starting from a root contract to gather relevant contract addresses for that root contract.

### Root Contracts

v3

- Pods

v4

- PrizePools
- PrizeDistributors

## Instructions

### Setup

1. `cp wrangler.example.toml wrangler.toml`
2. Fill in the missing values in `wrangler.toml`

#### Installation

1. `yarn`

#### Local Development

1. `wrangler dev --env <network name>` ex. `wrangler dev --env mainnet`

OR

1. `yarn dev:<network name>` ex. `yarn dev:mainnet`, `yarn dev:polygon`

### Deploying

#### To a single network

1. `wrangler publish --env <network name>` ex. `wrangler publish --env mainnet`

OR

1. `yarn publish:<network name>` ex. `yarn publish:mainnet`, `yarn publish:polygon`

#### All networks

`yarn publish:all`

## TODO

- Have a single environment with `/update` exposed for each network and each contract tree type
- Have multiple cron jobs running at different times, switch on chain id depending on the time run. Adding new chains will require a new cron, rather than a whole new environment/worker. https://developers.cloudflare.com/workers/examples/multiple-cron-triggers/
