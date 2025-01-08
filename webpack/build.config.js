const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const { APP_DIR, DIST_DIR } = require('./conf');
const defaultConfig = require('./defaults.config');

module.exports = Object.assign({}, defaultConfig, {
  mode: 'production',
  entry: {
    navmesh: `${APP_DIR}/lib/navMeshPlugin.js`
  },
  output: {
    filename: '[name]-plugin.js',
    path: DIST_DIR,
    library: 'phaser-navmesh-generation',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  externals: ['phaser'],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
  ]
});
