import MarchingSquares from './marchingSquares';
import Cluster from './cluster';
import Config from '../config';

/**
 * @class Hulls
 */
export default class Hulls extends MarchingSquares {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.generate();
  }

  /**
   * @method generate
   * @description Recursively search for outline clusters across the grid; if a cluster is found then
   *              the interior of that Cluster is checked for any 'reverse'
   */
  generate() {
    this.clusters = [];
    super.generate((contours, edges) => {
      this.clusters.push(new Cluster(contours, edges));
    });

    this.extractAllEdges();
  }

  /**
   * @method extractAllEdges
   * @description Extract all edges from all clusters
   */
  extractAllEdges() {
    const { width, height, tileWidth, tileHeight } = Config.mapDimensions;
    const w = width * tileWidth;
    const h = height * tileHeight;
    this.allEdges = [
      new Phaser.Geom.Line(0, 0, w, 0),
      new Phaser.Geom.Line(w, 0, w, h),
      new Phaser.Geom.Line(w, h, 0, h),
      new Phaser.Geom.Line(0, h, 0, 0)
    ];

    const parseCluster = ({ children, edges }) => {
      this.allEdges = this.allEdges.concat(edges.map((edge) => {
        const start = new Phaser.Math.Vector2(edge.x1, edge.y1);
        const end = new Phaser.Math.Vector2(edge.x2, edge.y2);

        return {
          start: start.multiply(tileWidth, tileHeight),
          end: end.multiply(tileWidth, tileHeight)
        };
      }));
      children.forEach(parseCluster);
    };

    this.clusters.forEach(parseCluster);
  }

  /**
   * @method getStartingPoint
   */
  getStartingPoint() {
    const { width, height } = Config.gridDimensions;
    let y = 0;
    let x;
    const offsetPoint = new Phaser.Geom.Point();

    for (y; y < height; y++) {
      x = 0;
      for (x; x < width; x++) {
        offsetPoint.x = x;
        offsetPoint.y = y;
        if (this.isValidTile(x, y)) {
          return offsetPoint;
        }
      }
    }
    return null;
  }

  /**
   * @method isValidTile
   * @description If the x|y coordinate is already within a cluster polygon, therefore it's already
   *              part of a discovered outline of a chunk, so it's safe to ignore
   */
  isValidTile(x, y) {
    const collisionIndices = Config.get('collisionIndices');

    if (this.isPartOfCluster(x, y)) {
      return false;
    }

    const tile = this.get(x, y);
    return tile && (collisionIndices.indexOf(tile.index) > -1 || tile.blocked);
  }

  /**
   * @method isPartOfCluster
   */
  isPartOfCluster(x, y) {
    const { clusters } = this;
    const length = clusters.length;
    let i = 0;
    for (i; i < length; i++) {
      if (clusters[i].polygon.contains(x, y)) {
        return true;
      }
    }
    return false;
  }
}
