import MapTile from './tile';
import MapSprite from './sprite';

/**
 * @class MapGrid
 * @description Contains a flattened, 1D Array copy of the Phaser.TilemapLayer imported from copyFrom()
 */
class MapGrid {
  /**
   * @constructor
   */
  constructor() {
    this.data = [];
    this.sprites = [];
    this.width = null;
    this.height = null;
  }

  /**
   * @method findSprite
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   */
  findSprite(x, y, width, height) {
    return this.sprites.find(s => s.x === x && s.y === y && s.width === width && s.height === height);
  }

  /**
   * @method get
   */
  get() {
    return this.data;
  }

  /**
   * @method getAt
   * @param {Number} x
   * @param {Number} y
   */
  getAt(x, y) {
    const i = y * this.width + x;
    return this.get()[i];
  }

  /**
   * @method copyFrom
   * @param {Array} tileLayer
   */
  copyFrom(tileLayer = []) {
    if (!tileLayer.length) {
      return;
    }

    this.data = [];
    this.width = tileLayer[0].length;
    this.height = tileLayer.length;
    let y = 0;
    let x;

    for (y; y < this.height; y++) {
      x = 0;
      for (x; x < this.width; x++) {
        this.data.push(new MapTile(tileLayer[y][x]));
      }
    }
  }

  /**
   * @method addSprite
   * @description Add a 'sprite' that acts as a blocker within the map-grid
   */
  addSprite(x, y, width, height) {
    const tiles = [];
    const yLength = y + height;
    const xLength = x + width;
    let yy = y;
    let xx;
    let tile;

    // If we already added a sprite with these exact dimensions, ignore
    if (this.findSprite(x, y, width, height)) {
      return false;
    }

    for (yy; yy < yLength; yy++) {
      xx = x;
      for (xx; xx < xLength; xx++) {
        tile = this.getAt(xx, yy);
        if (tile) {
          tile.blocked = true;
          tiles.push(tile);
        }
      }
    }

    const sprite = new MapSprite(x, y, width, height, tiles);
    this.sprites.push(sprite);

    return sprite;
  }

  /**
   * @method removeSprite
   * @description Remove sprite, toggle tiles back to false (but only those not overlapping with other sprites)
   * @param {String} uuid
   */
  removeSprite(uuid) {
    const { tiles } = this.sprites.find(sprite => sprite.uuid === uuid);
    let overlapping;

    // First, remove the sprite matching the provided UUID
    this.sprites = this.sprites.filter(sprite => sprite.uuid !== uuid);

    // Now, iterate through the removed Sprite's tiles and toggle to FALSE only those NOT also in other Sprites
    tiles.forEach(tile => {
      overlapping = this.sprites.find(sprite => sprite.tiles.find(t => t.x === tile.x && t.y === tile.y));
      if (!overlapping) {
        tile.blocked = false;
      }
    });
  }

  /**
   * @method toggleBlocked
   * @description Set the tile to ${blocked} if param present, otherwise toggle the value
   * @param {Number} x
   * @param {Number} y
   * @param {Boolean} blocked
   */
  toggleBlocked(x, y, blocked) {
    const tile = this.getAt(x, y);
    if (tile) {
      tile.blocked = blocked !== undefined ? blocked : !tile.blocked;
    }
  }

}

export default new MapGrid();