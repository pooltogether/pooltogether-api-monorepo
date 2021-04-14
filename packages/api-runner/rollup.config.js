import alias from '@rollup/plugin-alias'
import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'

const path = require('path')

export default {
  input: 'index.js',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  preserveModules: true,
  external: ['graphql-tag', 'graphql', 'graphql-anywhere', 'ethers', 'lodash'],
  plugins: [
    commonjs(),
    babel(),
    alias({
      entries: [
        { find: 'lib', replacement: path.resolve(__dirname, 'lib/') },
        { find: 'abis', replacement: path.resolve(__dirname, 'abis/') }
      ]
    })
  ]
}

// "@babel/core": "^7.13.15",
//   "@babel/plugin-proposal-object-rest-spread": "^7.13.8",
//   "@babel/plugin-proposal-optional-chaining": "^7.13.12",
//   "@babel/plugin-transform-destructuring": "^7.13.0",
//   "@babel/plugin-transform-template-literals": "^7.13.0",
//   "babel-loader": "^8.2.2",
//   "prettier": "^1.18.2"
// },
// "dependencies": {
//   "@pooltogether/current-pool-data": "^3.3.3",
//   "@pooltogether/etherplex": "^1.0.2",
//   "@pooltogether/evm-chains-extended": "^0.4.3",
//   "@pooltogether/loot-box": "^1.1.0",
//   "@pooltogether/pooltogether-contracts": "^3.3.7",
//   "ethers": "5.0.32",
//   "graphql": "^15.5.0",
//   "graphql-request": "^3.4.0",
//   "graphql-tag": "^2.11.0",
//   "lodash.clonedeep": "^4.5.0",
//   "lodash.merge": "^4.6.2",
//   "lodash.remove": "^4.7.0",
//   "rollup": "^2.45.2"
