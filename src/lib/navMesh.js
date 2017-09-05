import { Point, Polygon } from 'phaser-ce';
import cdt2d from 'cdt2d';

import AStar from './aStar';
import Debug from './debug';
import TileLayerClusters from './tileLayerClusters';
import NavMeshPolygon from './navMeshPolygon';
import { areLinesEqual, getRandomColour, offsetFunnelPath, sortLine } from './utils';

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

    this.points = [];
    this.polygons = [];

    this.generate(options);
  }

  /**
   * @method addToDelaunayPoints
   * @description Adds new vertex point to Array. Returns index of newly pushed point, or existin
   * @param {Number} x
   * @param {Number} y
   * @return {Number}
   */
  addToDelaunayPoints(x, y) {
    const { points, tileMap } = this;
    const { tileWidth, tileHeight } = tileMap;

    const index = points.findIndex(p => p[0] === x * tileWidth && p[1] === y * tileHeight);
    if (index !== -1) {
      return index;
    }

    points.push([ x * tileWidth, y * tileHeight ]);
    return points.length - 1;
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
    this.setOptions(options);
    this.generateDelaunayTriangulation();
    this.generatePolygonEdges();

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
    return this.polygons.find(polygon => polygon.contains(x, y));
  }

  /**
   * @method generateDelaunayTriangulation
   */
  generateDelaunayTriangulation() {
    const edges = this.initPointsForDelaunayTriangulation();
    const { game, points } = this;
    const delaunay = cdt2d(points, edges, { interior: false }) ||  [];
    const length = delaunay.length;
    let i = 0;
    let polygon;
    let triangle;

    this.polygons = [];
    for (i; i < length; i++) {
      triangle = delaunay[i];
      polygon = new NavMeshPolygon(game, ([]).concat(points[triangle[0]], points[triangle[1]], points[triangle[2]]));
      this.polygons.push(polygon);
    }
  }

  /**
   * @method generatePolygonEdges
   * @description Find all the other polys each one connects to.
   * @TODO Mine makes a few assumptions that the generated polygons are already connected in some way, given
   * it was generation by the Delaunay algorithm.
   */
  generatePolygonEdges() {
    const { game, polygons } = this;
    const polyLength = polygons.length;
    let i = 0;
    let polygon;
    let otherPolygon;

    for (i; i < polyLength; i++) {
      polygon = polygons[i];

      for (let j = i + 1; j < polyLength; j++) {
        otherPolygon = polygons[j];

        for (const edge of polygon.edges) {
          for (const otherEdge of otherPolygon.edges) {

            if (!areLinesEqual(edge, otherEdge)) {
              continue;
            }

            const { start, end } = sortLine(edge);

            polygon.addNeighbor(otherPolygon);
            otherPolygon.addNeighbor(polygon);

            polygon.addPortalFromEdge(edge, start, end);
            otherPolygon.addPortalFromEdge(otherEdge, start, end);
          }
        }
      }
    }

    this.aStar = new AStar(game, this); // Calculate the a-star grid for the polygons.
  }

  /**
   * @method initPointsForDelaunayTriangulation
   * @description Pass all found points into list, calculating the internal edges
   * @return {Array} edges
   */
  initPointsForDelaunayTriangulation() {
    const { collisionIndices, game, tileLayer, tileMap } = this;
    const { width, height } = tileMap;
    const tileLayerClusters = new TileLayerClusters(game, tileLayer, { collisionIndices });
    const edges = [];
    let startIndex;
    let endIndex;

    this.points = [];

    this.addToDelaunayPoints(0, 0);
    this.addToDelaunayPoints(width, 0);
    this.addToDelaunayPoints(0, height);
    this.addToDelaunayPoints(width, height);

    tileLayerClusters.clusters.forEach(cluster => {
      cluster.edges.forEach(edge => {
        startIndex = this.addToDelaunayPoints(edge.start.x, edge.start.y);
        endIndex = this.addToDelaunayPoints(edge.end.x, edge.end.y);
        edges.push([ startIndex, endIndex ]);
      });
    });

    return edges;
  }

  /**
   * @method renderMesh
   * @description Debug render the Delaunay generated Triangles
   */
  renderMesh() {
    const { game, polygons } = this;
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
    const { game, polygons } = this;
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

    this.polygons.forEach(polygon => {
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
