/* eslint-disable no-console */

import AStar from './astar/aStar';
import Debug from './debug';
import { offsetFunnelPath } from './utils';
import DelaunayGenerator from './delaunay/delaunayGenerator';

export const defaultOptions = {
  collisionIndices: [],
  narrownessThreshold: 0
};

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

    this.delaunay = new DelaunayGenerator(tileMap);

    this.generate(options);
  }

  /**
   * @method generate
   * @param {Object} options
   */
  generate(options) {
    const { tileLayer, tileMap } = this;
    const timerName = 'NavMesh generated in';

    console.warn('🛠 Building NavMesh. Beep Boop Boop 🤖');
    console.time(timerName);
    this.setOptions(options);
    this.delaunay.generate(this.collisionIndices, tileLayer, tileMap);
    this.aStar = new AStar(this); // Calculate the a-star grid for the polygons.
    console.timeEnd(timerName);

    Debug.draw({ delaunay: this.delaunay });
  }

  /**
   * @method getPath
   */
  getPath(startPosition, endPosition, offset) {
    const { aStar } = this;
    const aStarPath = aStar.search(startPosition, endPosition);
    if (!aStarPath) {
      return false;
    }

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
    const { collisionIndices, narrownessThreshold } = defaultOptions;

    Debug.set(game, tileLayer, options.debug);
    this.collisionIndices = options.collisionIndices || collisionIndices;
    this.narrownessThreshold = options.narrownessThreshold || narrownessThreshold;
  }
}
