import MapTile from './tile';

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
    this.width = null;
    this.height = null;
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
    console.warn('copyFrom', tileLayer);
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