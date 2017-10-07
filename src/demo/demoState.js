import { Keyboard, Math as PhaserMath, Point, State } from 'phaser-ce';
import NavMeshPlugin from '../lib/navMeshPlugin';
import AdvancedTiming from 'phaser-plugin-advanced-timing';
import DemoSprite from './demoSprite';

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
    game.stage.backgroundColor = '#2d2d2d';

    // Create blank tilemap
    this.tileMap = game.add.tilemap();
    this.tileMap.addTilesetImage('ground_1x1');
    this.tileMap.setCollision(COLLISION_INDICES);

    this.tileLayer = this.tileMap.create('demoLayer', WIDTH_TILES, HEIGHT_TILES, TILE_SIZE, TILE_SIZE);
    this.tileLayer.resizeWorld();

    this.drawAllGround();
    this.drawInitGrid();
    this.updateNavMesh();

    game.input.addMoveCallback(this.updateMarker, this);
    game.input.onUp.add(this.onUp, this);
    game.canvas.oncontextmenu = this.onRightClick;

    this.cursors = game.input.keyboard.createCursorKeys();
    this.isSpriteStamp = false;
    this.spriteUUIDs = [];
    game.input.keyboard.addKey(Keyboard.P).onDown.add(() => game.paused = !game.paused, this);
    game.input.keyboard.addKey(Keyboard.SPACEBAR).onDown.add(() => game.paused = !game.paused, this);
    game.input.keyboard.addKey(Keyboard.S).onDown.add(() => this.isSpriteStamp = !this.isSpriteStamp);
    game.input.keyboard.addKey(Keyboard.K).onDown.add(() => this.removeSprite());

    this.spriteGroup = new Phaser.Group(game);

    new DemoSprite(game, 200, 500, this.spriteGroup, this.tileLayer);
  }

  /**
   * @method drawAllGround
   */
  drawAllGround() {
    const { tileLayer, tileMap } = this;
    const { width, height } = tileMap;
    let y = 0;
    let x;
    for (y; y < height; y++) {
      x = 0;
      for (x; x < width; x++) {
        tileMap.putTile(24, x, y, tileLayer);
      }
    }
  }

  /**
   * @method drawInitGrid
   * @description Draw a quick, 'enclosed' area
   */
  drawInitGrid() {
    const { tileLayer, tileMap } = this;
    const startAtX = 3;
    const startAtY = 3;
    const yLength = startAtY + 10;
    let y = startAtY;
    let xLength;
    let x;
    let tileIndex;

    for (y; y < yLength; y++) {
      x = startAtX;
      xLength = startAtX + 20;
      for (x; x < xLength; x++) {
        if (x !== startAtX && y !== startAtY && x !== xLength - 1 && y !== yLength - 1) {
          continue;
        }

        tileIndex = Math.floor(PhaserMath.random(0, COLLISION_INDICES.length));
        tileMap.putTile(tileIndex, x, y, tileLayer);
      }
    }
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
    const { navMesh, spriteGroup } = this;
    const isRightButton = pointer.rightButton.isDown;
    const { withinGame, worldX, worldY } = pointer;
    const paths = [];

    if (!withinGame || !isRightButton || !navMesh) {
      return;
    }

    const destination = new Point(worldX, worldY);
    spriteGroup.forEachAlive(sprite => {
      const { position, width, height } = sprite;
      const size = Math.max(width, height);
      const path = navMesh.getPath(position, destination, size);

      // If no path found, do nothing with the sprite
      if (!path) {
        return sprite.addPath([]);
      }

      paths.push(path);
      sprite.addPath(path);
    }, this);

    this.renderPaths(paths);
  }

  /**
   * @method buildNavMesh
   */
  buildNavMesh() {
    const { game, tileMap, tileLayer } = this;

    this.navMesh = this.plugin.buildFromTileLayer(tileMap, tileLayer, {
      collisionIndices: COLLISION_INDICES,
      timingInfo: true,
      midPointThreshold: 0,
      debug: {
        hulls: false,
        navMesh: true,
        navMeshNodes: false,
        polygonBounds: false,
        aStarPath: false
      }
    });

    timeout = undefined;

    game.world.bringToTop(this.spriteGroup);
  }

  /**
   * @method renderPaths
   */
  renderPaths(paths = []) {
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

      function renderPoint(point) {
        PATH_GRAPHICS.lineTo(point.x, point.y);

        PATH_GRAPHICS.beginFill(0xff0000);
        PATH_GRAPHICS.drawCircle(point.x, point.y, 10);
        PATH_GRAPHICS.endFill();
        PATH_GRAPHICS.moveTo(point.x, point.y);
      }

      // Render the PATHS
      PATH_GRAPHICS.beginFill(0xff0000);
      PATH_GRAPHICS.drawCircle(pathStart.x, pathStart.y, 10);
      PATH_GRAPHICS.endFill();
      PATH_GRAPHICS.moveTo(pathStart.x, pathStart.y);

      PATH_GRAPHICS.lineStyle(2, 0x6666ff, 1);
      otherPathPoints.forEach(renderPoint);

      // Render the OFFSET PATHS
      PATH_GRAPHICS.beginFill(0x00f000);
      PATH_GRAPHICS.drawCircle(offsetStart.x, offsetStart.y, 10);
      PATH_GRAPHICS.endFill();
      PATH_GRAPHICS.moveTo(offsetStart.x, offsetStart.y);

      PATH_GRAPHICS.lineStyle(2, 0x33ff33, 1);
      otherOffsetPoints.forEach(renderPoint);
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

    this.spriteGroup.update();
  }

  /**
   * @method updateMarker
   */
  updateMarker({ leftButton, worldX, worldY }, originalEvent, c) {
    const { tileLayer, tileMap } = this;

    if (this.isSpriteStamp) {
      return this.updateSprite(leftButton, worldX, worldY);
    }
    this.stamp && this.stamp.clear();

    const tile = Math.floor(PhaserMath.random(0, COLLISION_INDICES.length));

    const x = tileLayer.getTileX(worldX) * TILE_SIZE;
    const y = tileLayer.getTileY(worldY) * TILE_SIZE;

    if (leftButton.isDown) {
      tileMap.putTile(tile, tileLayer.getTileX(x), tileLayer.getTileY(y), tileLayer);
      this.updateNavMesh(1000);
    }
  }

  /**
   * @method updateNavMesh
   * @description Update / rebuild the NavMesh
   */
  updateNavMesh(delay = 0) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => this.buildNavMesh(), delay);
  }

  /**
   * @method updateSprite
   * @description Track the mouse movement and 'stamp' a test cluster onto the map
   */
  updateSprite(leftButton, x, y) {
    const { tileWidth, tileHeight } = this.tileMap;
    const stampWidth = 3;
    const stampHeight = 2;

    if (!this.stamp) {
      this.stamp = this.game.add.graphics(0, 0);
    } else {
      this.stamp.clear();
    }

    this.stamp.beginFill(0x0000ff, 0.8);
    const tileX = Math.floor(x / 32);
    const tileY = Math.floor(y / 32);
    this.stamp.drawRect(tileX * tileWidth, tileY * tileHeight, stampWidth * tileWidth, stampHeight * tileHeight);
    this.stamp.endFill();

    if (!leftButton.isDown) {
      return;
    }

    const sprite = this.plugin.addSprite(tileX, tileY, stampWidth, stampHeight);
    if (sprite) {
      this.spriteUUIDs.push(sprite.uuid);
    }
  }

  /**
   * @method removeSprite
   * @description Pop and remove the last sprite
   */
  removeSprite() {
    if (!this.spriteUUIDs.length) {
      return;
    }

    this.plugin.removeSprite(this.spriteUUIDs.pop());
  }
}