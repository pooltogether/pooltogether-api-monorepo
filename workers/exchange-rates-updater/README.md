# `Pooltogether API - Exchange Rates Updater`

This repo contains a Cloudflare Worker that is triggered by a cron job to keep the data in a Cloudflare KV store up to date.

This worker fetches data from CoinGecko.

## Instructions

> Note: The worker is currently configured to point to a development KV when run locally. Data may be stale as there are no cron jobs keeping this up to date.

#### Setup

1. `cp wrangler.example.toml wrangler.toml`
2. Fill in the missing values in `wrangler.toml`

#### Installation

1. `yarn`

#### Local Development

1. `wrangler dev` OR `yarn dev`

### Deploying

1. `wrangler publish` OR `yarn publish`
