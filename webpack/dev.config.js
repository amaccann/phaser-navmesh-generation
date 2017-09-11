const webpack = require('webpack');
const { APP_DIR, BUILD_DIR, NODE_ENV } = require('./conf');
const defaultConfig = require('./defaults.config');

module.exports = Object.assign({}, defaultConfig, {
  entry: {
    demo: `${APP_DIR}/demo/index.js`
  },
  plugins: NODE_ENV === 'production' ? [ new webpack.optimize.UglifyJsPlugin({
      drop_console: true,
      minimize: true,
      output: {
        comments: false
      }
    }
  )] : [],
  devServer: {
    contentBase: BUILD_DIR,
    port: 9999
  }
});
