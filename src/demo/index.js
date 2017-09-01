import 'pixi';
import 'p2';
import 'phaser';
import NavMeshPlugin from '../lib/navMeshPlugin';
import AdvancedTiming from 'phaser-plugin-advanced-timing';

const TILE_SIZE = 32;

const config = {
  width: 800,
  height: 600,
  renderer: Phaser.AUTO,
  parent: '',
  state: {
    preload,
    create,
    update
  },
  transparent: false,
  antialias: true,
  physicsConfig: { arcade: true },
};

const game = new Phaser.Game(config);
let tileMap;
let tileLayer;
let marker;
let currentTile = 0;
let cursors;
let timeout;
let plugin;
let timing;

function preload() {
  plugin = game.plugins.add(NavMeshPlugin);
  timing = game.plugins.add(AdvancedTiming, { mode: 'graph' });
  game.load.image('ground_1x1', 'assets/tilemaps/tiles/ground_1x1.png');
}

function create() {
  const { game } = this;

  game.stage.backgroundColor = '#2d2d2d';

  tileMap = game.add.tilemap(); // Creates a blank tilemap
  tileMap.addTilesetImage('ground_1x1');

  // Creates a new blank layer and sets the map dimensions.
  // In this case the map is 40 x 30 tiles in size and the tiles are 32x32 pixels in size.
  tileLayer = tileMap.create('level1', 40, 30, TILE_SIZE, TILE_SIZE);
  tileLayer.scrollFactorX = 0.5;
  tileLayer.scrollFactorY = 0.5;
  tileLayer.resizeWorld();

  //  Create our tile selector at the top of the screen
  createTileSelector();

  game.input.addMoveCallback(updateMarker, this);

  cursors = game.input.keyboard.createCursorKeys();
}

function update() {
  if (cursors.left.isDown) {
    game.camera.x -= 4;
  } else if (cursors.right.isDown) {
    game.camera.x += 4;
  }

  if (cursors.up.isDown) {
    game.camera.y -= 4;
  } else if (cursors.down.isDown) {
    game.camera.y += 4;
  }
}

function pickTile(sprite, pointer) {
  currentTile = game.math.snapToFloor(pointer.x, 32) / 32;
  console.warn('new tile index', currentTile);
}

function buildNavMesh() {
  const navMesh = plugin.buildFromTileLayer(tileMap, tileLayer, {
    collisionIndices: [0, 1, 2]
  });
  timeout = undefined;
}

function updateMarker() {
  marker.x = tileLayer.getTileX(game.input.activePointer.worldX) * TILE_SIZE;
  marker.y = tileLayer.getTileY(game.input.activePointer.worldY) * TILE_SIZE;

  if (game.input.mousePointer.isDown) {
    tileMap.putTile(currentTile, tileLayer.getTileX(marker.x), tileLayer.getTileY(marker.y), tileLayer);
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(buildNavMesh, 2000);
  }
}

function createTileSelector() {
  //  Our tile selection window
  const tileSelector = game.add.group();

  const tileSelectorBackground = game.make.graphics();
  tileSelectorBackground.beginFill(0x000000, 0.5);
  tileSelectorBackground.drawRect(0, 0, 800, 34);
  tileSelectorBackground.endFill();

  tileSelector.add(tileSelectorBackground);

  const tileStrip = tileSelector.create(1, 1, 'ground_1x1');
  tileStrip.inputEnabled = true;
  tileStrip.events.onInputDown.add(pickTile, this);

  tileSelector.fixedToCamera = true;

  //  Our painting marker
  marker = game.add.graphics();
  marker.lineStyle(2, 0x000000, 1);
  marker.drawRect(0, 0, 32, 32);

}
