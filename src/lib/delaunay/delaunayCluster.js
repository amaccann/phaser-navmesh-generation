import cdt2d from 'cdt2d';
import Config from '../config';

/**
 * @class DelaunayCluster
 * @description Takes a suite of edges & calculates Constrained Delaunay triangles based on provided gen. options
 */
export default class DelaunayCluster {
  /**
   * @constructor
   * @param {Phaser.Line[]} edges
   * @param {Phaser.Line[]} parentEdges
   * @param {Phaser.Line[]} allChildEdges
   * @param {Object} options
   */
  constructor(edges = [], parentEdges = [], allChildEdges = [], options = {}) {
    this.points = [];
    this.edges = [];
    this.polygons = [];
    this.options = options;

    this.generate(edges, parentEdges, allChildEdges);
  }

  /**
   * @method addPoint
   * @description Adds new vertex point to Array. Returns index of newly pushed point, or existing.
   *              (Note that we must take into account any Offset involved in the TilemapLayer)
   * @param {Phaser.Geom.Point} point
   * @return {Number}
   */
  addPoint(point) {
    const {tileLayer} = Config;
    const {layer, x: offsetX, y: offsetY} = tileLayer;
    const {tileHeight, tileWidth} = layer || {};
    const { x, y } = point;
    const { points } = this;

    const worldX = (x * tileWidth) + offsetX;
    const worldY = (y * tileHeight) + offsetY;

    const index = points.findIndex(p => p[0] === worldX && p[1] === worldY);
    if (index !== -1) {
      return index;
    }

    points.push([ worldX, worldY ]);
    return points.length - 1;
  }

  /**
   * @method generate
   * @param {Phaser.Line[]} polygonEdges
   * @param {Phaser.Line[]} parentEdges
   * @param {Phaser.Line[]} childClusterEdge
   */
  generate(polygonEdges, parentEdges, childClusterEdge) {
    const { edges, points, options } = this;
    let startIndex;
    let endIndex;
    let midPointIndex;
    let delaunay;

    const addEdgeToPoints = edge => {
      const start = edge.getPointA();
      const end = edge.getPointB();
      startIndex = this.addPoint(start);
      endIndex = this.addPoint(end);
      if (Config.get('useMidPoint')) {
        midPointIndex = this.addPoint(Phaser.Geom.Line.GetMidPoint(edge));
      }
    };

    const addToEdges = () => {
      if (Config.get('useMidPoint')) {
        edges.push([ startIndex, midPointIndex ]);
        edges.push([ midPointIndex, endIndex]);
      } else {
        edges.push([ startIndex, endIndex ]);
      }
    };

    parentEdges.forEach(addEdgeToPoints, this);

    childClusterEdge.forEach(edge => {
      addEdgeToPoints(edge);
      addToEdges();
    });

    polygonEdges.forEach(edge => {
      addEdgeToPoints(edge);
      addToEdges();
    });

    delaunay = cdt2d(points, edges, options) ||  [];
    this.polygons = delaunay.map(triangle => triangle.map(index => points[index]));
  }
}