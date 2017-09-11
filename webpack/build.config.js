const webpack = require('webpack');
const { APP_DIR, NODE_ENV } = require('./conf');
const defaultConfig = require('./defaults.config');

module.exports = Object.assign({}, defaultConfig, {
  entry: {
    plugin: `${APP_DIR}/lib/navMeshPlugin.js`
  },
  externals: ['phaser-ce'],
  plugins: NODE_ENV === 'production' ? [ new webpack.optimize.UglifyJsPlugin({
      drop_console: true,
      minimize: true,
      output: {
        comments: false
      }
    }
  )] : []
});
