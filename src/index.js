import 'pixi';
import 'p2';
import 'phaser';
import pkg from '../package.json';

const style = { font: 'bold 19px Arial', fill: '#fff' };
const version = pkg.dependencies['phaser-ce'].substr(1);

const config = {
  width: 800,
  height: 600,
  renderer: Phaser.AUTO,
  parent: '',
  state: {
    preload,
    create,
  },
  transparent: false,
  antialias: true,
  physicsConfig: { arcade: true },
};

const game = new Phaser.Game(config);

function preload() {
  game.load.image('study', 'assets/img/study.png');
}

function create() {
  const { centerX, centerY } = game.world;
  const objects = [
    game.add.text(centerX, centerY * 0.8, `Welcome to Phaser ${version}`, style),
  ];

  objects.forEach(obj => obj.anchor.setTo(0.5, 0.5));
}
