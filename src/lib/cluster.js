import { Line, Point, Polygon } from 'phaser-ce';
import { optimiseEdges, triarea2 } from './utils';
import MarchingSquares from './marchingSquares';

/**
 * @class Cluster
 * @TODO - Maybe look into making this recursive itself; iteratively checking internally for
 *         either 'holes' or 'blobs', depending on what was last checked at invoking level
 */
export default class Cluster extends MarchingSquares {
  constructor(contours, edges, grid, collisionIndices, checkCollision) {
    super(grid, collisionIndices);

    this.polygon = new Polygon(contours);
    this.edges = edges;
    this.checkCollision = checkCollision;

    optimiseEdges(this.edges);

    this.setBounds();
    this.generate();
  }

  /**
   * @method generate
   * @description
   */
  generate() {
    const { collisionIndices, grid, checkCollision } = this;

    this.clusters = [];
    super.generate((contours, edges) => {
      this.clusters.push(new Cluster(contours, edges, grid, collisionIndices, !checkCollision));
    });
  }

  /**
   * @method getStartingPoint
   */
  getStartingPoint() {
    const offsetPoint = new Point();
    const { bounds } = this;
    const { x, y, width, height } = bounds;

    const yLength = y + height;
    const xLength = x + width;
    let yy = y;
    let xx;


    for (yy; yy < yLength; yy++) {
      xx = x;
      for (xx; xx < xLength; xx++) {
        offsetPoint.x = xx;
        offsetPoint.y = yy;
        if (this.isValidTile(xx, yy)) {
          console.log('startingPoint', offsetPoint);
          return offsetPoint;
        }
      }
    }
    return null;
  }

  /**
   * @method get
   * @description Only return a Tile that is WITHIN this cluster's bounding-box
   * @param {Number} tileX
   * @param {Number} tileY
   */
  get(tileX, tileY) {
    const { bounds } = this;
    const { x, y, width, height } = bounds;

    if (tileX < x || tileX > width + x || tileY < y || tileY > height + y) {
      return false;
    }

    const row = this.grid[tileY];
    return row && row[tileX];
  }

  /**
   * @method isValidTile
   * @description Because we only want tiles WITHIN the Cluster, check first that it's actually part of that Cluster's
   *              polygon and NOT simply one of the trailing tiles caught up within the bounding-box of the Cluster.
   * @param {Number} x
   * @param {Number} y
   */
  isValidTile(x, y) {
    const { collisionIndices, checkCollision, polygon } = this;
    const tile = this.get(x, y);

    if (!polygon.contains(x, y) || this.isPartOfCluster(x, y) || !tile) {
      return false;
    }

    if (checkCollision) {
      return collisionIndices.indexOf(tile.index) === -1;
    } else {
      return collisionIndices.indexOf(tile.index) > -1;
    }
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
   * @method setBounds
   */
  setBounds() {
    const [ first, ...rest ] = this.edges;
    let startingX = Math.min(first.start.x, first.end.x);
    let startingY = Math.min(first.start.y, first.end.y);
    let endX = Math.max(first.start.x, first.end.x);
    let endY = Math.max(first.start.y, first.end.y);

    rest.forEach(edge => {
      const { start, end } = edge;
      const minX = Math.min(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxX = Math.max(start.x, end.x);
      const maxY = Math.max(start.y, end.y);

      startingX = minX < startingX ? minX : startingX;
      startingY = minY < startingY ? minY : startingY;
      endX = maxX > endX ? maxX : endX;
      endY = maxY > endY ? maxY : endY;
    });

    this.bounds = {
      x: startingX,
      y: startingY,
      width: endX - startingX,
      height: endY - startingY
    };
  }

}
