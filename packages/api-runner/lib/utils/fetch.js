const nodeFetch = require('node-fetch')

export let fetch = nodeFetch.default
export const setFetch = (_fetch) => {
  fetch = _fetch.bind()
}
