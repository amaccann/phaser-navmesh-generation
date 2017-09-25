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
   * @description Adds new vertex point to Array. Returns index of newly pushed point, or existin
   * @param {Phaser.Point} point
   * @return {Number}
   */
  addPoint(point) {
    const { x, y } = point;
    const { tileWidth, tileHeight } = Config.mapDimensions;
    const { points } = this;

    const index = points.findIndex(p => p[0] === x * tileWidth && p[1] === y * tileHeight);
    if (index !== -1) {
      return index;
    }

    points.push([ x * tileWidth, y * tileHeight ]);
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
      startIndex = this.addPoint(edge.start);
      endIndex = this.addPoint(edge.end);
      if (Config.get('useMidPoint')) {
        midPointIndex = this.addPoint(edge.midPoint());
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