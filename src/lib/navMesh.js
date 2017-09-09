import AStar from './astar/aStar';
import Debug from './debug';
import { offsetFunnelPath } from './utils';
import DelaunayGenerator from './delaunay/delaunayGenerator';

let MESH_GRAPHICS;
let NODES_GRAPHICS;
let BOUNDS_GRAPHICS;

/**
 * @class NavMesh
 * @description TODO: Establish a stronger algorithm to generate hulls, ideally something usning
 *              The Marching Squares algorithm to better establish 'block' areas, gaps etc. Currently
 *              the Phaser, phaserTiledHull plugin ain't the best...
 */
export default class NavMesh {
  constructor(game, tileMap, tileLayer, options = {}) {
    this.game = game;
    this.tileMap = tileMap;
    this.tileLayer = tileLayer;

    this.delaunay = new DelaunayGenerator(game, tileMap);

    this.generate(options);
  }

  /**
   * @method destroy
   */
  destroy() {
    MESH_GRAPHICS && MESH_GRAPHICS.destroy();
    BOUNDS_GRAPHICS && BOUNDS_GRAPHICS.destroy();
    NODES_GRAPHICS && NODES_GRAPHICS.destroy();
  }

  /**
   * @method generate
   * @param {Object} options
   */
  generate(options) {
    const { game, tileLayer, tileMap } = this;
    const timerName = 'NavMesh built in';

    console.warn('🛠 Building NavMesh. Beep Boop Boop 🤖');
    console.time(timerName);
    this.setOptions(options);
    this.delaunay.generate(this.collisionIndices, tileLayer, tileMap);
    this.aStar = new AStar(game, this); // Calculate the a-star grid for the polygons.
    console.timeEnd(timerName);

    Debug.draw({ delaunay: this.delaunay });
  }

  /**
   * @method getPath
   */
  getPath(startPosition, endPosition, offset) {
    const { aStar } = this;
    const aStarPath = aStar.search(startPosition, endPosition);
    const path = aStarPath.path;
    const offsetPath = offsetFunnelPath(path, offset);

    Debug.draw({ aStarPath });
    return { path, offsetPath };
  }

  /**
   * @method getPolygonByXY
   */
  getPolygonByXY(x, y) {
    return this.delaunay.polygons.find(polygon => polygon.contains(x, y));
  }

  /**
   * @method setOptions
   * @param {Object} options
   */
  setOptions(options) {
    const { game, tileLayer } = this;
    Debug.set(game, tileLayer, options.debug);
    this.collisionIndices = options.collisionIndices || [];
  }
}
