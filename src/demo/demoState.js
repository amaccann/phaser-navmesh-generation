import { Math as PhaserMath, Point, State } from 'phaser-ce';
import NavMeshPlugin from '../lib/navMeshPlugin';
import AdvancedTiming from 'phaser-plugin-advanced-timing';

const SCROLL_CAMERA_BY = 10;
const COLLISION_INDICES = [0, 1, 2];
const WIDTH_TILES = 40;
const HEIGHT_TILES = 30;
const TILE_SIZE = 32;
let PATH_GRAPHICS;
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
    let sprite;

    game.stage.backgroundColor = '#2d2d2d';

    this.sprites = [];
    for (const i of [1, 2, 3]) {
      sprite = game.add.sprite(game.world.randomX, game.world.randomY, 'agent');
      sprite.anchor.setTo(0.5, 0.5);
      this.sprites.push(sprite);
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
    const paths = [];

    if (!withinGame || !isRightButton || !navMesh) {
      return;
    }

    const destination = new Point(worldX, worldY);
    sprites.forEach(sprite => {
      const { position, width, height } = sprite;
      const size = Math.max(width, height);
      const path = navMesh.getPath(position, destination, size);
      console.log('path', path);
      paths.push(path);
    });

    this.renderPaths(paths);
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
   * @method renderPaths
   */
  renderPaths(paths = []) {
    const DEBUG_COLOUR_ORANGE = 0xffa500;
    const { game } = this;
    if (!PATH_GRAPHICS) {
      PATH_GRAPHICS = game.add.graphics(0, 0);
    } else {
      PATH_GRAPHICS.clear();
    }

    paths.forEach(p => {
      const { path, offsetPath } = p;
      const [pathStart, ...otherPathPoints] = path;
      const [offsetStart, ...otherOffsetPoints] = offsetPath;

      // PATH_GRAPHICS.moveTo(pathStart.x, pathStart.y);
      // PATH_GRAPHICS.lineStyle(4, 0x00ff00, 1);
      // otherPathPoints.forEach((point) => PATH_GRAPHICS.lineTo(point.x, point.y));
      // PATH_GRAPHICS.lineStyle(0, 0xffffff, 1);

      PATH_GRAPHICS.moveTo(offsetStart.x, offsetStart.y);
      PATH_GRAPHICS.lineStyle(4, 0x33ff33, 1);
      otherOffsetPoints.forEach((point) => PATH_GRAPHICS.lineTo(point.x, point.y));
      PATH_GRAPHICS.lineStyle(0, 0xffffff, 1);
    });
  }

  /**
   * @method update
   */
  update() {
    const { cursors, game } = this;
    const camera = game.camera;

    if (cursors.left.isDown) {
      camera.x -= SCROLL_CAMERA_BY;
    } else if (cursors.right.isDown) {
      camera.x += SCROLL_CAMERA_BY;
    }

    if (cursors.up.isDown) {
      camera.y -= SCROLL_CAMERA_BY;
    } else if (cursors.down.isDown) {
      camera.y += SCROLL_CAMERA_BY;
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