# `Pooltogether API - Contract Address Updater`

This repo contains a Cloudflare Worker that is triggered by a cron job to keep the data in a Cloudflare KV store up to date. The worker also exposes `/update` which allows a manual trigger of the update.

This worker aggregates data from external sources and stores them in the KV so we are not reliant on their services.

## Instructions

> Note: The worker is currently configured to point to a development KV when run locally. Data may be stale as there are no cron jobs keeping this up to date.

###### Setup

1. `cp wrangler.example.toml wrangler.toml`
2. Fill in `account_id`, the Sentry logging variables and `INFURA_ID`.

###### Installation

1. `yarn`

###### Local Development

1. `wrangler dev --env <network name>` ex. `wrangler dev --env mainnet`

   OR

1. `yarn dev <network name>` ex. `yarn dev mainnet`

###### Deploying a single network

`wrangler publish --env <network name>` ex. `wrangler publish --env mainnet`

###### Deploying workers for all networks

`yarn publish-all`
