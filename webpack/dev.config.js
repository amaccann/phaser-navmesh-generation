const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const { APP_DIR, BUILD_DIR, NODE_ENV } = require('./conf');
const defaultConfig = require('./defaults.config');

const minimizer = NODE_ENV === 'production' ? [
  new TerserPlugin({
    terserOptions: {
      output: {
        comments: false,
      },
    },
  }),
] : [];

module.exports = Object.assign({}, defaultConfig, {
  mode: NODE_ENV || 'development',
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
  optimization: {
    minimizer
  },
  devServer: {
    // contentBase: BUILD_DIR,
    port: 9999
  }
});
