const webpack = require('webpack');
const { APP_DIR, NODE_ENV, DIST_DIR } = require('./conf');
const defaultConfig = require('./defaults.config');

module.exports = Object.assign({}, defaultConfig, {
  entry: {
    plugin: `${APP_DIR}/lib/navMeshPlugin.js`
  },
  output: {
    filename: 'navmesh-plugin.js',
    path: DIST_DIR
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
