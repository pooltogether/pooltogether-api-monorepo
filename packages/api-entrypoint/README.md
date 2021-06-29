# `Pooltogether API - Entrypoint`

This repo contains a Cloudflare Worker that is the entry point to the PoolTogether API. This worker is what users will be interacting with.

## Development

> Note: The worker is currently configured to point to a development KV when run locally. Data may be stale as there are no cron jobs keeping this up to date.

###### To run locally

1. Copy `wrangler.example.toml` to `wrangler.toml` and fill in `account_id` and the Sentry variables.
2. `yarn`
3. `yarn dev`

###### To run locally with the production KV

> Note: Not dangerous. This worker only exposes reads.

1. Copy `wrangler.example.toml` to `wrangler.toml` and fill in `account_id` and the Sentry variables.
2. `yarn`
3. `yarn dev-prod`

###### To deploy

`yarn publish`
