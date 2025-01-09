import {Point} from 'phaser';
import DemoSprite from './demoSprite';

const SCROLL_CAMERA_BY = 10;
const COLLISION_INDICES = [0, 1, 2];
const WIDTH_TILES = 40;
const HEIGHT_TILES = 30;
const TILE_SIZE = 32;
let PATH_GRAPHICS;
let timeout;

export default class DemoState extends Phaser.Scene {
  /**
   * @method preload
   */
  preload() {
    // Load the demo assets
    this.load.image('ground_1x1', 'assets/tilemaps/tiles/ground_1x1.png');
    this.load.image('agent', 'assets/agent.png');
  }

  /**
   * @method create
   */
  create() {
    // Create blank tilemap
    this.tileMap = this.make.tilemap({key: 'map', tileWidth: TILE_SIZE, tileHeight: TILE_SIZE});
    this.tileSet = this.tileMap.addTilesetImage('ground_1x1');
    this.tileLayer = this.tileMap.createBlankLayer('Layer1', this.tileSet, 0, 0, WIDTH_TILES, HEIGHT_TILES)
    this.tileMap.setCollision(COLLISION_INDICES);

    this.drawAllGround();
    this.drawInitGrid();
    this.updateNavMesh();


    // game.input.addMoveCallback(this.updateMarker, this);
    // game.input.on(this.onUp, this);
    this.input.on('pointerdown', this.onMouseUp, this)
    this.input.mouse.disableContextMenu()

    const cursors = this.input.keyboard.createCursorKeys();
    const controlConfig = {
        camera: this.cameras.main,
        left: cursors.left,
        right: cursors.right,
        up: cursors.up,
        down: cursors.down,
        speed: 0.5
    };

    this.controls = new Phaser.Cameras.Controls.FixedKeyControl(controlConfig);
    this.cameras.main.setBounds(0, 0, this.tileLayer.width, this.tileLayer.height);

    // this.isSpriteStamp = false;
    // this.spriteUUIDs = [];
    // game.input.keyboard.addKey(Keyboard.P).onDown.add(() => game.paused = !game.paused, this);
    // game.input.keyboard.addKey(Keyboard.SPACEBAR).onDown.add(() => game.paused = !game.paused, this);
    // this.input.keyboard.addKey(Keyboard.S).onDown.add(() => this.isSpriteStamp = !this.isSpriteStamp);
    // game.input.keyboard.addKey(Keyboard.K).onDown.add(() => this.removeSprite());

    this.spriteGroup = new Phaser.GameObjects.Group(this);

    this.sprite = new DemoSprite(this, 200, 500, this.spriteGroup);
  }

  /**
   * @method drawAllGround
   */
  drawAllGround() {
    const { tileLayer, tileMap } = this;
    const { width, height } = tileLayer;
    let y = 0;
    let x;
    for (y; y < height; y++) {
      x = 0;
      for (x; x < width; x++) {
        tileLayer.putTileAt(24, x, y, false)
      }
    }
  }

  /**
   * @method drawInitGrid
   * @description Draw a quick, 'enclosed' area
   */
  drawInitGrid() {
    const { tileLayer } = this;
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
        if (x !== startAtX && y !== startAtY && x !== xLength - 4 && y !== yLength - 1) {
          continue;
        }

        tileIndex = Math.floor(Phaser.Math.Between(0, COLLISION_INDICES.length - 1));
        tileLayer.putTileAt(tileIndex, x, y, false);
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
  onMouseUp(pointer) {
    const isRightButton = pointer.button === 2;
    const isLeftButton = pointer.button === 0;
    const { worldX, worldY } = pointer;

    switch (true) {
      case isLeftButton:
        return this.updateMarker(pointer);
        case isRightButton:
          return this.getNavMeshPath(new Phaser.Geom.Point(worldX, worldY));
      default:
        return null;
    }
  }
  
  getNavMeshPath (destination) {
    const sprites = this.spriteGroup.getChildren() || [];
    sprites.forEach(sprite => {
      const { position, width, height } = sprite;
      const size = Math.max(width, height);
      const path = this.navMesh.getPath(sprite, destination, size);

      // If no path found, do nothing with the sprite
      if (!path) {
        return sprite.addPath([]);
      }

      // paths.push(path);
      this.sprite.addPath(path);
      this.renderPaths([path])
    }, this);
  };


  /**
   * @method buildNavMesh
   */
  buildNavMesh() {
    const { game, tileMap, tileLayer } = this;

    this.navMesh = this.navMeshPlugin.buildFromTileLayer(tileMap, tileLayer, {
      collisionIndices: COLLISION_INDICES,
      timingInfo: true,
      midPointThreshold: 0,
      debug: {
        hulls: false,
        navMesh: true,
        navMeshNodes: true,
        polygonBounds: false,
        aStarPath: false
      }
    });
    console.log('this.navMesh', this.navMesh);

    timeout = undefined;

    // game.world.bringToTop(this.spriteGroup);
  }

  /**
   * @method renderPaths
   */
  renderPaths(paths = []) {
    if (!PATH_GRAPHICS) {
      PATH_GRAPHICS = this.add.graphics(0, 0);
    } else {
      PATH_GRAPHICS.clear();
    }

    paths.forEach(data => {
      console.log('data', data);
      const { path, offsetPath } = data;
      const [pathStart, ...otherPathPoints] = path;
      const [offsetStart, ...otherOffsetPoints] = offsetPath;
      const [polygonStart, ...polygons] = data.polygons || [];

      function renderPoint(point) {
        PATH_GRAPHICS.lineTo(point.x, point.y);

        PATH_GRAPHICS.fillStyle(0xff0000);
        PATH_GRAPHICS.fillCircle(point.x, point.y, 10);
        PATH_GRAPHICS.moveTo(point.x, point.y);
      }

      // Render the PATHS
      PATH_GRAPHICS.fillStyle(0xff0000);
      PATH_GRAPHICS.fillCircle(pathStart.x, pathStart.y, 10);
      PATH_GRAPHICS.moveTo(pathStart.x, pathStart.y);

      PATH_GRAPHICS.lineStyle(2, 0x6666ff, 1);
      otherPathPoints.forEach(renderPoint);

      // Render the OFFSET PATHS
      PATH_GRAPHICS.fillStyle(0x00f000);
      PATH_GRAPHICS.fillCircle(offsetStart.x, offsetStart.y, 10);
      PATH_GRAPHICS.moveTo(offsetStart.x, offsetStart.y);

      PATH_GRAPHICS.lineStyle(2, 0x33ff33, 1);
      otherOffsetPoints.forEach(renderPoint);

      if (data?.polygons?.length) {
        PATH_GRAPHICS.fillStyle(0x3333ff, 0.25);
      PATH_GRAPHICS.fillPoints(polygonStart?.points);

      PATH_GRAPHICS.fillStyle(0xff3333, 0.25);
      polygons.forEach((poly) => {
        PATH_GRAPHICS.fillPoints(poly.points);
      })
      }
    });
  }

  /**
   * @method update
   */
  update(time, delta) {
    this.controls.update(delta);
    this.sprite.update();
    // this.spriteGroup.update();
  }

  /**
   * @method updateMarker
   */
  updateMarker({worldX, worldY } = {}) {
    const { tileLayer } = this;

    // if (this.isSpriteStamp) {
    //   return this.updateSprite(leftButton, worldX, worldY);
    // }
    // this.stamp && this.stamp.clear();

    const tileIndex = Math.floor(Phaser.Math.Between(0, COLLISION_INDICES.length - 1));
    const tile = tileLayer.getTileAtWorldXY(worldX, worldY);
    if (tile) {
      tile.index = tileIndex;
      tileLayer.calculateFacesAt(tile.x, tile.y);
      // @TODO Update navmesh
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
