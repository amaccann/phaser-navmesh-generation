import { Math as PhaserMath, Point, State } from 'phaser-ce';
import NavMeshPlugin from '../lib/navMeshPlugin';
import AdvancedTiming from 'phaser-plugin-advanced-timing';

const COLLISION_INDICES = [0, 1, 2];
const WIDTH_TILES = 40;
const HEIGHT_TILES = 30;
const TILE_SIZE = 32;
let timeout;

export default class DemoState extends State {
  constructor() {
    super();
  }

  /**
   * @method preload
   */
  preload() {
    const { game } = this;
    this.plugin = game.plugins.add(NavMeshPlugin);
    this.timing = game.plugins.add(AdvancedTiming, { mode: 'graph' });

    // Load the demo assets
    game.load.image('ground_1x1', 'assets/tilemaps/tiles/ground_1x1.png');
    game.load.image('agent', 'assets/agent.png');
  }

  /**
   * @method create
   */
  create() {
    const { game } = this;

    game.stage.backgroundColor = '#2d2d2d';

    this.sprites = [];
    for (const i of [1, 2, 3]) {
      this.sprites.push(game.add.sprite(game.world.randomX, game.world.randomY, 'agent'));
    }

    // Create blank tilemap
    this.tileMap = game.add.tilemap();
    this.tileMap.addTilesetImage('ground_1x1');

    this.tileLayer = this.tileMap.create('demoLayer', WIDTH_TILES, HEIGHT_TILES, TILE_SIZE, TILE_SIZE);
    this.tileLayer.resizeWorld();

    game.input.addMoveCallback(this.updateMarker, this);
    game.input.onUp.add(this.onUp, this);
    game.canvas.oncontextmenu = this.onRightClick;

    this.cursors = game.input.keyboard.createCursorKeys();

  }

  /**
   * @method onRightClick
   */
  onRightClick(e) {
    e.preventDefault();
  }

  /**
   * @method onUp
   * @param {Phaser.Pointer} pointer
   */
  onUp(pointer) {
    const { navMesh, sprites } = this;
    const isRightButton = pointer.rightButton.isDown;
    const { withinGame, worldX, worldY } = pointer;

    if (!withinGame || !isRightButton || !navMesh) {
      return;
    }

    const destination = new Point(worldX, worldY);
    sprites.forEach(sprite => {
      const { position, width, height } = sprite;
      const size = Math.max(width, height);
      const path = navMesh.getPath(position, destination, size);
      console.log('path', path);
    });
  }

  /**
   * @method pickTile
   * @param {Phaser.Sprite} sprite
   * @param {Phaser.Pointer} pointer
   */
  pickTile(sprite, pointer) {
    const { game } = this;
    this.currentTile = game.math.snapToFloor(pointer.x, 32) / 32;
    console.warn('new tile index', this.currentTile);
  }

  /**
   * @method buildNavMesh
   */
  buildNavMesh() {
    const { tileMap, tileLayer } = this;

    this.navMesh = this.plugin.buildFromTileLayer(tileMap, tileLayer, {
      collisionIndices: COLLISION_INDICES
    });

    timeout = undefined;
  }

  /**
   * @method update
   */
  update() {
    const { cursors, game } = this;

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

  /**
   * @method updateMarker
   */
  updateMarker() {
    const { game, tileLayer, tileMap } = this;
    const { activePointer, mousePointer } = game.input;
    const tile = Math.floor(PhaserMath.random(0, COLLISION_INDICES.length));

    const x = tileLayer.getTileX(activePointer.worldX) * TILE_SIZE;
    const y = tileLayer.getTileY(activePointer.worldY) * TILE_SIZE;

    if (mousePointer.leftButton.isDown) {
      tileMap.putTile(tile, tileLayer.getTileX(x), tileLayer.getTileY(y), tileLayer);
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => this.buildNavMesh(), 1000);
    }
  }
}