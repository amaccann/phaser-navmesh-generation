import { Point } from 'phaser-ce';
import MarchingSquares from './marchingSquares';
import Cluster from './cluster';
import Debug from '../debug';

let graphics;

export default class Hulls extends MarchingSquares {
  constructor(game, tileLayer, options = {}) {
    const { data } = tileLayer.layer;
    super(data, options.collisionIndices);

    this.game = game;
    this.tileLayer = tileLayer;

    this.generate();
  }

  /**
   * @method generate
   * @description Recursively search for outline clusters across the grid; if a cluster is found then
   *              the interior of that Cluster is checked for any 'reverse'
   */
  generate() {
    const { grid, collisionIndices } = this;

    this.clusters = [];
    super.generate((contours, edges) => {
      this.clusters.push(new Cluster(contours, edges, grid, collisionIndices, true));
    });

    if (Debug.settings.marchingSquares) {
      this.renderDebug();
    }
  }

  /**
   * @method tileDimensions
   */
  get tileDimensions() {
    const tile = this.get(0, 0);
    const { width, height } = tile;

    return { width, height };
  }

  /**
   * @method getStartingPoint
   */
  getStartingPoint() {
    const { grid } = this;
    const height = grid.length;
    const width = grid[0].length;
    let y = 0;
    let x;
    const offsetPoint = new Point();

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
   * @method getWorldXY
   * @param {Phaser.Point|Object} point
   */
  getWorldXY(point) {
    const { width, height } = this.tileDimensions;
    return {
      x: point.x * width,
      y: point.y * height
    };
  }

  /**
   * @method isValidTile
   * @description If the x|y coordinate is already within a cluster polygon, therefore it's already
   *              part of a discovered outline of a chunk, so it's safe to ignore
   */
  isValidTile(x, y) {
    const { collisionIndices } = this;

    if (this.isPartOfCluster(x, y)) {
      return false;
    }

    const tile = this.get(x, y);
    return tile && collisionIndices.indexOf(tile.index) > -1;
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

  /**
   * @method renderDebug
   * @description Render all discovered (recursive) clusters & their edges as geometry
   */
  renderDebug() {
    const { clusters, game } = this;

    if (!graphics) {
      graphics = game.add.graphics(0, 0);
    } else {
      graphics.clear();
    }

    graphics.lineStyle(0, 0xffffff, 1);

    function drawCluster(cluster) {
      graphics.beginFill(0xff0000, 0.5);
      graphics.drawPolygon(cluster.polygon.points.map(this.getWorldXY, this));
      graphics.endFill();

      if (cluster.children.length) {
        cluster.children.forEach(drawCluster, this);
      }
    }

    clusters.forEach(drawCluster, this);
  }
}
