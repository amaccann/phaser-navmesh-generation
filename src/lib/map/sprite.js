import {v4} from 'uuid';

export default class MapSprite {
  constructor(x, y, width, height, tiles = []) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.uuid = v4();
    this.tiles = tiles;
  }
}