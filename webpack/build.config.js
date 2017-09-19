const webpack = require('webpack');
const { APP_DIR, DIST_DIR } = require('./conf');
const defaultConfig = require('./defaults.config');

module.exports = Object.assign({}, defaultConfig, {
  entry: {
    navmesh: `${APP_DIR}/lib/navMeshPlugin.js`
  },
  output: {
    filename: '[name]-plugin.js',
    path: DIST_DIR
  },
  externals: ['phaser-ce'],
  plugins: [ new webpack.optimize.UglifyJsPlugin({
      drop_console: true,
      sourceMap: true,
      minimize: true,
      output: {
        comments: false
      }
    }
  )]
});
