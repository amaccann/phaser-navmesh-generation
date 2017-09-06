import cdt2d from 'cdt2d';

import AStar from './astar/aStar';
import Debug from './debug';
import { areLinesEqual, getRandomColour, offsetFunnelPath, sortLine } from './utils';
import DelaunayGenerator from './delaunay/delaunayGenerator';

const diameter = 10;
const font = 'carrier_command';
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

    if (Debug.settings.navMesh) {
      this.renderMesh();
    }

    if (Debug.settings.navMeshNodes) {
      this.renderNodes();
    }

    if (Debug.settings.renderBoundingRadii) {
      this.renderBoundingRadii();
    }
  }

  /**
   * @method getPath
   */
  getPath(startPosition, endPosition, offset) {
    const { aStar } = this;
    const aStarPath = aStar.search(startPosition, endPosition);
    const path = aStarPath.path;
    const offsetPath = offsetFunnelPath(path, offset);

    return { path, offsetPath };
  }

  /**
   * @method getPolygonByXY
   */
  getPolygonByXY(x, y) {
    return this.delaunay.polygons.find(polygon => polygon.contains(x, y));
  }

  /**
   * @method renderMesh
   * @description Debug render the Delaunay generated Triangles
   */
  renderMesh() {
    const { game, delaunay } = this;
    const { polygons } = delaunay;
    if (MESH_GRAPHICS) {
      MESH_GRAPHICS.clear();
    } else {
      MESH_GRAPHICS = game.add.graphics(0, 0);
    }

    MESH_GRAPHICS.beginFill(0xff33ff, 0.25);
    MESH_GRAPHICS.lineStyle(1, 0xffffff, 1);
    polygons.forEach(poly => MESH_GRAPHICS.drawPolygon(poly.points));
    MESH_GRAPHICS.endFill();
  }

  /**
   * @method renderNodes
   */
  renderNodes() {
    const { game, delaunay } = this;
    const { polygons } = delaunay;
    if (!NODES_GRAPHICS) {
      NODES_GRAPHICS = game.add.graphics(0, 0);
    } else {
      NODES_GRAPHICS.clear();
    }

    NODES_GRAPHICS.lineStyle(5, 0x00b2ff, 0.5);
    polygons.forEach((poly) => {
      poly.neighbors.forEach((neighbour) => {
        NODES_GRAPHICS.moveTo(poly.centroid.x, poly.centroid.y);
        NODES_GRAPHICS.lineTo(neighbour.centroid.x, neighbour.centroid.y);
      });

      NODES_GRAPHICS.beginFill(0xffffff);
      NODES_GRAPHICS.drawCircle(poly.centroid.x, poly.centroid.y, diameter);
      NODES_GRAPHICS.endFill();
    });
  }

  /**
   * @method renderBoundingRadii
   */
  renderBoundingRadii() {
    const { game } = this;
    if (BOUNDS_GRAPHICS) {
      BOUNDS_GRAPHICS.clear();
    } else {
      BOUNDS_GRAPHICS = game.add.graphics(0, 0);
    }

    this.delaunay.polygons.forEach(polygon => {
      BOUNDS_GRAPHICS.lineStyle(2, getRandomColour(), 1);
      BOUNDS_GRAPHICS.drawCircle(polygon.centroid.x, polygon.centroid.y, polygon.boundsRadius * 2)
    });
    BOUNDS_GRAPHICS.lineStyle(0, 0xffffff);
  }

  /**
   * @method setOptions
   * @param {Object} options
   */
  setOptions(options) {
    Debug.set(options.debug);
    this.collisionIndices = options.collisionIndices || [];
  }
}
