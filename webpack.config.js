const webpack = require('webpack');
const path = require('path');

const APP_DIR = path.resolve(__dirname, 'src');
const BUILD_DIR = path.resolve(__dirname, 'public');
const PHASER_DIR = path.join(__dirname, '/node_modules/phaser-ce');
const NODE_ENV = process.env.NODE_ENV;

module.exports = {
  entry: {
    plugin: `${APP_DIR}/lib/navMeshPlugin.js`,
    demo: `${APP_DIR}/demo/index.js`
  },
  output: {
    filename: '[name].bundle.js',
    path: BUILD_DIR
  },
  externals: ['phaser-ce'],
  devtool: 'source-map',
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [APP_DIR, 'node_modules'],
    alias: {
      constants: `${APP_DIR}/constants`, // https://github.com/webpack/webpack/issues/4666
      phaser: path.join(PHASER_DIR, 'build/custom/phaser-split.js'),
      pixi: path.join(PHASER_DIR, 'build/custom/pixi.js'),
      p2: path.join(PHASER_DIR, 'build/custom/p2.js')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        include: APP_DIR,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      },
      {
        test: /pixi\.js/,
        use: [{
          loader: 'expose-loader',
          options: 'PIXI'
        }]
      },
      {
        test: /phaser-split\.js$/,
        use: [{
          loader: 'expose-loader',
          options: 'Phaser'
        }]
      },
      {
        test: /p2\.js/,
        use: [{
          loader: 'expose-loader',
          options: 'p2'
        }]
      }
    ]
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
    port: 8080
  }
};