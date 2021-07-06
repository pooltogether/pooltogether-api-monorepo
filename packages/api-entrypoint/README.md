# `Pooltogether API - Entrypoint`

This repo contains a Cloudflare Worker that is the entry point to the PoolTogether API. This worker is what users will be interacting with.

## Instructions

> Note: The worker is currently configured to point to a development KV when run locally. Data may be stale as there are no cron jobs keeping this up to date.

###### Setup

1. `cp wrangler.example.toml wrangler.toml`
2. Fill in `account_id` and the Sentry variables.

###### Installation

1. `yarn`

###### Local Development

1. `yarn dev`

###### Local Development with the production KV

> Note: This is not dangerous. This worker only exposes read functions.

1. `yarn dev-prod`

###### Deploying

`yarn publish-prod`
