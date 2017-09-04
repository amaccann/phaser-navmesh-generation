import { Plugin, Tilemap, TilemapLayer } from 'phaser-ce';
import NavMesh from './navMesh';

const defaultOptions = {
  collisionIndices: []
};

export default class NavMeshPlugin extends Plugin {
  constructor(game, manager) {
    super(game, manager);
  }

  /**
   * @method buildFromTileLayer
   * @param {Tilemap} tileMap
   * @param {TilemapLayer} tileLayer
   * @param {Object} options
   */
  buildFromTileLayer(tileMap, tileLayer, options = {}) {
    const opts = Object.assign({}, defaultOptions, options);
    if (this.navMesh) {
      this.navMesh.generate(opts);
    } else {
      this.navMesh = new NavMesh(this.game, tileMap, tileLayer, opts);
    }

    return this.navMesh;
  }
}