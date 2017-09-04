import 'pixi';
import 'p2';
import 'phaser';

import { Game } from 'phaser-ce';
import DemoState from './demoState';

const config = {
  width: 800,
  height: 600,
  renderer: Phaser.AUTO,
  parent: '',
  transparent: false,
  antialias: true,
  physicsConfig: { arcade: true }
};

const game = new Game(config);
game.state.add('demo', DemoState);
game.state.start('demo');
