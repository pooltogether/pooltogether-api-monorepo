const path = require('path')

module.exports = (env) => {
  return {
    entry: './index.js',
    mode: 'production',
    output: {
      globalObject: 'this',
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist')
    },
    resolve: {
      // mainFields: ['browser', 'module', 'main'],
      // mainFields: ['module', 'browser', 'main'],
      // mainFields: ['main', 'module', 'browser'],
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
          use: [
            {
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
            },
            'source-map-loader'
          ]
        }
      ]
    }
  }
}
