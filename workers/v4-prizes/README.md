# `Pooltogether API - Tsunami Prizes`

## Instructions

> Note: The worker is currently configured to point to a development KV when run locally. Data may be stale as there are no cron jobs keeping this up to date.

###### Setup

1. `cp wrangler.example.toml wrangler.toml`
2. Fill in `account_id` and the Sentry variables.

###### Installation

1. `yarn`

###### Local Development

1. `yarn dev`

###### Deploying

1. `yarn publish-prod`
