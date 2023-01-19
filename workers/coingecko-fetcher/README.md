# `Pooltogether API - CoinGecko Fetcher`

This repo contains a Cloudflare Worker that is triggered by a cron job to keep the data in a Cloudflare KV store up to date.

This worker fetches data from CoinGecko.

## Instructions

### Setup

1. `cp wrangler.example.toml wrangler.toml`
2. Fill in the missing values in `wrangler.toml`

#### Installation

1. `yarn`

#### Local Development

1. `wrangler dev` OR `yarn dev`

### Deploying

1. `wrangler publish` OR `yarn publish`
