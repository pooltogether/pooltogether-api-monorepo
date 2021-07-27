import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import { babel } from '@rollup/plugin-babel'

const path = require('path')

export default {
  input: 'index.js',
  output: {
    dir: 'dist',
    format: 'cjs'
    // sourcemap: 'inline'
  },
  preserveModules: true,
  external: [
    '@ethersproject/abi',
    '@ethersproject/units',
    '@pooltogether/current-pool-data',
    '@pooltogether/loot-box/abis/LootBoxController',
    '@pooltogether/etherplex',
    '@pooltogether/pooltogether-contracts',
    '@pooltogether/pooltogether-contracts/abis/PrizePool',
    '@pooltogether/pooltogether-contracts/abis/PeriodicPrizeStrategy',
    '@pooltogether/pooltogether-contracts/abis/TokenFaucet',
    '@pooltogether/pooltogether-contracts/abis/MultipleWinners',
    '@pooltogether/pooltogether-contracts/abis/Registry',
    '@pooltogether/pooltogether-contracts/abis/Reserve',
    '@pooltogether/pooltogether-contracts/abis/CTokenInterface',
    '@pooltogether/utilities',
    'ethers',
    'graphql-tag',
    'graphql',
    'graphql-anywhere',
    'lodash',
    'lodash.clonedeep',
    'lodash.merge',
    'lodash.remove',
    'mime-db',
    'graphql-request'
  ],
  plugins: [
    commonjs(),
    babel({
      babelHelpers: 'bundled'
    }),

    alias({
      entries: [
        { find: 'lib', replacement: path.resolve(__dirname, 'lib/') },
        { find: 'abis', replacement: path.resolve(__dirname, 'abis/') }
      ]
    })
  ]
}
