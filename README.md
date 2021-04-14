# `PoolTogether API monorepo`

API calls are all GET requests and use the following structure:

https://pooltogether-api.com/pools/:chainId/:poolAddress

Example: the DAI pool's data would be:

https://pooltogether-api.com/pools/1/0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a

### TODO:

- caching
- get it live on pooltogether-api.com
- handle requests using various services / cloudflare, alchemy, infura, etc
