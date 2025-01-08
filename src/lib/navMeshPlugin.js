import NavMesh, { defaultOptions } from './navMesh';
import Config from './config';
// import Debug from './debug';

function err() {
  return console.error('[NavMeshPlugin] no TileMap / TileLayer found');
}

export default class NavMeshPlugin extends Phaser.Plugins.ScenePlugin {
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
    if (!tileMap || !tileLayer) {
      return err();
    }

    Config.set({ tileMap, tileLayer, ...options });
    // Debug.set(this.scene, tileLayer, options.debug);

    console.log('123', this);
    if (this.navMesh) {
      this.navMesh.generate();
    } else {
      this.navMesh = new NavMesh(this.game);
    }

    return this.navMesh;
  }

  /**
   * @method addSprite
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   * @param {Boolean} refresh
   */
  addSprite(x, y, width, height, refresh = true) {
    const tileLayer = Config.get('tileLayer');
    if (!tileLayer) {
      return err();
    }

    const sprite = Config.mapGrid.addSprite(x, y, width, height);
    if (sprite && refresh) {
      this.navMesh.generate();
    }

    return sprite;
  }

  /**
   * @method removeSprite
   * @param {String} uuid
   * @param {Boolean} refresh
   */
  removeSprite(uuid, refresh = true) {
    const tileLayer = Config.get('tileLayer');
    if (!tileLayer) {
      return err();
    }

    Config.mapGrid.removeSprite(uuid);
    if (refresh) {
      this.navMesh.generate();
    }
  }
}

window.NavMeshPlugin = NavMeshPlugin;