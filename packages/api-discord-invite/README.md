# `Pooltogether API - Discord Invite Bot`

This service hands out Discord invite keys if the requester passed a captcha check at https://pooltogether.com/discord

###### Setup

1. `cp wrangler.example.toml wrangler.toml`
2. Fill in `account_id` and `H_CAPTCHA_SECRET`.

###### Installation

1. `yarn`

###### Local Development

1. `wrangler dev`

###### Deploying

`wrangler publish`
