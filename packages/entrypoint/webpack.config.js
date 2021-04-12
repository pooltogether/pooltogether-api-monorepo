const path = require('path')

module.exports = (env) => {
  // console.log('INFURA_ID: ', process.env.INFURA_ID) // 'local'

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
              // presets: [['@babel/preset-env']],
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
// loaders: [
//     {
//       test: /\.js$/,
//       exclude: /(node_modules)/,
//       loader: 'babel-loader'
//     }
//   ]
