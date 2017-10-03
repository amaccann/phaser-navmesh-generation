import NavMesh, { defaultOptions } from './navMesh';
import Config from './config';
import Debug from './debug';

function err() {
  return console.error('[NavMeshPlugin] no TileMap / TileLayer found');
}

export default class NavMeshPlugin extends Phaser.Plugin {
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
    if (!tileMap || !tileLayer) {
      return err();
    }

    Config.set({ tileMap, tileLayer, ...options });
    Debug.set(this.game, tileLayer, options.debug);

    if (this.navMesh) {
      this.navMesh.generate(opts);
    } else {
      this.navMesh = new NavMesh(this.game);
    }

    return this.navMesh;
  }

  /**
   * @method toggleBlockedAtXY
   * @param {Number} x
   * @param {Number} y
   */
  toggleBlockedAtXY(x, y) {
    const tileLayer = Config.get('tileLayer');
    if (!tileLayer) {
      return err();
    }

    Config.toggleTileBlockedAtXY(x, y);
  }

}

window.NavMeshPlugin = NavMeshPlugin;