const path = require('path')

module.exports = (env) => {
  return {
    target: 'webworker',
    entry: './index.js',
    mode: 'production',
    resolve: {
      mainFields: ['browser', 'module', 'main'],
      alias: {
        lib: path.resolve(__dirname, 'lib/'),
        abis: path.resolve(__dirname, 'abis/')
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              plugins: [
                '@babel/plugin-transform-destructuring',
                '@babel/plugin-proposal-object-rest-spread',
                '@babel/plugin-transform-template-literals',
                '@babel/plugin-proposal-optional-chaining'
              ],
              babelrc: false
            }
          }
        }
      ]
    }
  }
}
