import cdt2d from 'cdt2d';

import Hulls from './hulls';
import NavMeshPolygon from '../navMeshPolygon';
import { areLinesEqual, sortLine } from '../utils';

/**
 * @class DelaunayGenerator
 * @description Helper class to generate the delaunay triangles used in building the NavMesh
 */
export default class DelaunayGenerator {
  constructor(game, tileMap) {
    this.game = game;
    this.points = [];
    this.polygons = [];
    this.tileMap = tileMap;
  }

  /**
   * @method addPoint
   * @description Adds new vertex point to Array. Returns index of newly pushed point, or existin
   * @param {Number} x
   * @param {Number} y
   * @return {Number}
   */
  addPoint(x, y) {
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
   * @method generate
   */
  generate(collisionIndices, tileLayer, tileMap) {
    const edges = this.initPoints(collisionIndices, tileLayer, tileMap);
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

    this.calculateNeighbours();
  }

  /**
   * @method generatePolygonEdges
   * @description Find all neighbours for each Polygon generated; we assume all are potentially connected given Delaunay.
   */
  calculateNeighbours() {
    const { polygons } = this;
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
  }

  /**
   * @method initPoints
   * @description Pass all found points into list, calculating the internal edges
   * @return {Array} edges
   */
  initPoints(collisionIndices, tileLayer, tileMap) {
    const { game } = this;
    const { width, height } = tileMap;
    const edges = [];
    let startIndex;
    let endIndex;

    this.hulls = new Hulls(game, tileLayer, { collisionIndices });
    this.points = [];

    this.addPoint(0, 0);
    this.addPoint(width, 0);
    this.addPoint(0, height);
    this.addPoint(width, height);

    this.hulls.clusters.forEach(cluster => {
      cluster.edges.forEach(edge => {
        startIndex = this.addPoint(edge.start.x, edge.start.y);
        endIndex = this.addPoint(edge.end.x, edge.end.y);
        edges.push([ startIndex, endIndex ]);
      });
    });

    return edges;
  }
}