/* eslint-disable no-console */

import AStar from './astar/aStar';
import Debug from './debug';
import { offsetFunnelPath } from './utils';
import DelaunayGenerator from './delaunay/delaunayGenerator';

export const defaultOptions = {
  collisionIndices: [],
  midPointThreshold: 0
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

    this.delaunay = new DelaunayGenerator(tileMap, tileLayer);

    this.generate(options);
  }

  /**
   * @method generate
   * @param {Object} options
   */
  generate(options) {
    const timerName = '[NavMeshPlugin] NavMesh generated in';

    this.setOptions(options);
    if (!this.collisionIndices || !this.collisionIndices.length) {
      console.error('[NavMeshPlugin] No collision-indices found, cannot generate NavMesh. Exiting...');
    }

    console.warn('[NavMeshPlugin] 🛠 Building NavMesh. Beep Boop Boop 🤖');
    console.time(timerName);
    this.delaunay.generate(this.collisionIndices);
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
    const { collisionIndices, midPointThreshold } = defaultOptions;

    Debug.set(game, tileLayer, options.debug);
    this.collisionIndices = options.collisionIndices || collisionIndices;
    this.midPointThreshold = options.midPointThreshold || midPointThreshold;
  }
}
