/* eslint-disable no-console */

import AStar from './astar/aStar';
import Debug from './debug';
import { offsetFunnelPath } from './utils';
import DelaunayGenerator from './delaunay/delaunayGenerator';
import Config from './config';

/**
 * @class NavMesh
 */
export default class NavMesh {
  constructor(game) {
    this.game = game;

    this.delaunay = new DelaunayGenerator();
    this.generate();
  }

  /**
   * @method generate
   */
  generate() {
    const timerName = '[NavMeshPlugin] NavMesh generated in';
    const collisionIndices = Config.collisionIndices;

    if (!collisionIndices || !collisionIndices.length) {
      console.error('[NavMeshPlugin] No collision-indices found, cannot generate NavMesh. Exiting...');
    }

    console.warn('[NavMeshPlugin] 🛠 Building NavMesh. Beep Boop Boop 🤖');
    console.time(timerName);
    this.delaunay.generate();
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

}
