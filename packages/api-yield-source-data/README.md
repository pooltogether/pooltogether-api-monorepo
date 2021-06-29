# `Pooltogether API - Yield Source Data`

This repo contains a Cloudflare Worker that is triggered by a cron job to keep the data in a Cloudflare KV store up to date. The worker also exposes `/update` which allows a manual trigger of the update.

This worker aggregates data from external sources and stores them in the KV so we are not reliant on their services.

## Development

> Note: The worker is currently configured to point to a development KV when run locally. Data may be stale as there are no cron jobs keeping this up to date.

###### To run locally

1. Copy `wrangler.example.toml` to `wrangler.toml` and fill in `account_id` and the Sentry variables.
2. `yarn`
3. `yarn dev`

###### To deploy

`yarn publish`
