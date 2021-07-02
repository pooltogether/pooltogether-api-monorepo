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
    'graphql-tag',
    'graphql',
    'graphql-anywhere',
    'ethers',
    'lodash',
    '@ethersproject/abi',
    '@ethersproject/units',
    'mime-db',
    '@pooltogether/pooltogether-contracts',
    'graphql-request',
    '@pooltogether/etherplex'
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
