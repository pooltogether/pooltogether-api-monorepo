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
