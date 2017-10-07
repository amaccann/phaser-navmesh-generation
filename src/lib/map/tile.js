/**
 * @class MapTile
 */
export default class MapTile {
  /**
   * @constructor
   * @param {Object} tile
   */
  constructor({ x, y, index }) {
    this.x = x;
    this.y = y;
    this.index = index;
    this.blocked = false;
  }
}