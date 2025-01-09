import {Game} from 'phaser';
import DemoState from './demoState';
import NavMeshPlugin from '../lib/navMeshPlugin';

const config = {
  width: 1200,
  height: 900,
  physics: { default: 'arcade',
    arcade: {
      // gravity: { y: 200 },
      debug: true
    }
  },
  plugins: {
    scene: [
      { key: 'NavMeshPlugin', plugin: NavMeshPlugin, mapping: 'navMeshPlugin' }
    ]
  },
  scene: [
    DemoState
  ],
};

const game = new Game(config);
console.warn('game', game);