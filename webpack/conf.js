const path = require('path');

module.exports = {
  APP_DIR: path.resolve(__dirname, '../src'),
  BUILD_DIR: path.resolve(__dirname, '../public'),
  PHASER_DIR: path.join(__dirname, '../node_modules/phaser-ce'),
  NODE_ENV: process.env.NODE_ENV
};