import { Color, Line, Point, Polygon } from 'phaser-ce';
import Cluster from './cluster';

let graphics;
const timerName = 'Finding clusters with Marching Squares:';
const WHILE_CEILING = 500;
const DIRECTIONS = {
  NONE: 0,
  UP: -1,
  LEFT: -1,
  RIGHT: 1,
  DOWN: 1
};


/**
 * @function checkIfCollinear
 * @description Are the 2 lines collinear? lineDeltaY / lineDeltaX = segmentDeltaY / segmentDeltaX
 * @param {Line} line1
 * @param {Line} line2
 */
function checkIfCollinear(line1, line2) {
  const delta1 = Point.subtract(line1.end, line1.start);
  const delta2 = Point.subtract(line2.end, line2.start);

  return (delta1.x * delta2.y) - (delta1.y * delta2.x) === 0;
}

export default class TileLayerClusters {
  constructor(game, tileLayer, options = {}) {
    const { data } = tileLayer.layer;
    this.game = game;
    this.grid = data;
    this.collisionIndices = options.collisionIndices;
    this.debug = options.debug;

    this.generate();
  }

  /**
   * @method generate
   */
  generate() {
    console.time(timerName);
    let discoveredPoints;
    let loop = 0;

    this.clusters = [];

    // Once generate() returns no points => IE, no new clusters found, break out of the do/while
    do {
      discoveredPoints = this.findCluster();
      loop++;
      if (loop >= WHILE_CEILING) {
        console.error('PROBLEMS CALCULATING, EXITING');
        break;
      }
    } while (discoveredPoints);

    if (this.debug.marchingSquares) {
      this.renderDebug();
    }
    console.timeEnd(timerName);
  }

  /**
   * @method findCluster
   * @description Find a cluster of colliding tiles, and create a Polygon from these tile coordinates
   */
  findCluster() {
    const startPoint = this.getStartingPoint();
    const currentPoint = new Point();
    const contours = [];
    const lines = [];
    let clone;

    if (!startPoint) {
      return null;
    }

    currentPoint.copyFrom(startPoint);
    const step = new Point();
    const previous = new Point(); // Save the previous step...

    let closed = false;
    while (!closed) {
      const squareValue = this.getSquareValue(currentPoint);
      switch (squareValue) {
        // /* going UP with these cases:
        //
        // +---+---+   +---+---+   +---+---+
        // | 1 |   |   | 1 |   |   | 1 |   |
        // +---+---+   +---+---+   +---+---+
        // |   |   |   | 4 |   |   | 4 | 8 |
        // +---+---+  	+---+---+  	+---+---+
        //
        // */
        case 1 :
        case 5 :
        case 13 :
          step.setTo(DIRECTIONS.NONE, DIRECTIONS.UP);
          break;
        // /* going DOWN with these cases:
        //
        // +---+---+   +---+---+   +---+---+
        // |   |   |   |   | 2 |   | 1 | 2 |
        // +---+---+   +---+---+   +---+---+
        // |   | 8 |   |   | 8 |   |   | 8 |
        // +---+---+  	+---+---+  	+---+---+
        //
        // */
        case 8 :
        case 10 :
        case 11 :
          step.setTo(DIRECTIONS.NONE, DIRECTIONS.DOWN);
          break;
        // /* going LEFT with these cases:
        //
        // +---+---+   +---+---+   +---+---+
        // |   |   |   |   |   |   |   | 2 |
        // +---+---+   +---+---+   +---+---+
        // | 4 |   |   | 4 | 8 |   | 4 | 8 |
        // +---+---+  	+---+---+  	+---+---+
        //
        // */
        case 4 :
        case 12 :
        case 14 :
          step.setTo(DIRECTIONS.LEFT, DIRECTIONS.NONE);
          // stepX = DIRECTIONS.LEFT;
          // stepY = DIRECTIONS.NONE;
          break;
        // /* going RIGHT with these cases:
        //
        // +---+---+   +---+---+   +---+---+
        // |   | 2 |   | 1 | 2 |   | 1 | 2 |
        // +---+---+   +---+---+   +---+---+
        // |   |   |   |   |   |   | 4 |   |
        // +---+---+  	+---+---+  	+---+---+
        //
        // */
        case 2 :
        case 3 :
        case 7 :
          step.setTo(DIRECTIONS.RIGHT, DIRECTIONS.NONE);
          break;
        case 6 :
          // /* special saddle point case 1:
          //
          // +---+---+
          // |   | 2 |
          // +---+---+
          // | 4 |   |
          // +---+---+
          //
          // going LEFT if coming from UP
          // else going RIGHT
          //
          // */
          if (previous.x === DIRECTIONS.NONE && previous.y === DIRECTIONS.UP) {
            step.setTo(DIRECTIONS.LEFT, DIRECTIONS.NONE);
          } else {
            step.setTo(DIRECTIONS.RIGHT, DIRECTIONS.NONE);
          }
          break;
        case 9 :
          // /* special saddle point case 2:
          //
          //   +---+---+
          //   | 1 |   |
          //   +---+---+
          //   |   | 8 |
          //   +---+---+
          //
          //   going UP if coming from RIGHT
          //   else going DOWN
          //
          //   */
          if (previous.x === DIRECTIONS.RIGHT && previous.y === DIRECTIONS.NONE) {
            step.setTo(DIRECTIONS.NONE, DIRECTIONS.LEFT);
          } else {
            step.setTo(DIRECTIONS.NONE, DIRECTIONS.RIGHT);
          }
          break;
      }

      clone = currentPoint.clone();
      contours.push(clone); // save contour
      currentPoint.add(step.x, step.y);

      // Create a line from the current point & next one along...
      lines.push(new Line(clone.x, clone.y, currentPoint.x, currentPoint.y));

      previous.copyFrom(step);

      // If we return to first point, loop is done.
      if (currentPoint.equals(startPoint)) {
        closed = true;
      }
    }


    if (contours.length) {
      this.clusters.push(new Cluster(contours, lines));
    }

    // If no contour points found, then there were no passing clusters found
    return !!contours.length;
  }

  /**
   * @method get
   */
  get(x, y) {
    const row = this.grid[y];
    return row && row[x];
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
        if (this.isCollisionAt(x, y)) {
          return offsetPoint;
        }
      }
    }
    return null;
  }

  /**
   * @method getSquareValue
   * @param {Point} point
   * @description Evalulate the square value for a 2x2 grid, the 'actual' tile as bottom-right
   */
  getSquareValue(point) {
    const { x, y } = point;
    let squareValue = 0;

    // checking upper left pixel
    if (this.isCollisionAt(x - 1, y - 1)) { // UPPER-LEFT
      squareValue += 1;
    }
    // checking upper pixel
    if (this.isCollisionAt(x, y - 1)) { // UP
      squareValue += 2;
    }

    if (this.isCollisionAt(x - 1, y)) { // LEFT
      squareValue += 4;
    }

    if (this.isCollisionAt(x, y)) {
      squareValue += 8;
    }
    return squareValue;
  }

  /**
   * @method isCollisionAt
   * @description If the x|y coordinate is already within a cluster polygon, therefore it's already
   *              part of a discovered outline of a chunk, so it's safe to ignore
   */
  isCollisionAt(x, y) {
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
      if (clusters[i].contains(x, y)) {
        return true;
      }
    }
    return false;
  }

  /**
   * @method renderDebug
   * @description Render all discovered clusters & their edges as geometry
   */
  renderDebug() {
    const { clusters, game } = this;
    const { width, height } = this.tileDimensions;
    if (!graphics) {
      graphics = game.add.graphics(0, 0);
    } else {
      graphics.clear();
    }

    graphics.beginFill(0xff0000, 0.5);
    graphics.lineStyle(0, 0xffffff, 1);
    clusters.forEach(cluster => {
      const map = cluster.points.map(p => {
        return {
          x: p.x * width,
          y: p.y * height
        };
      });
      graphics.drawPolygon(map);

      cluster.edges.forEach(edge => {
        const lineColour = Color.HSLtoRGB(Math.random(), 1, 0.5).color;
        graphics.lineStyle(5, lineColour, 1);
        graphics.moveTo(edge.start.x * width, edge.start.y * height);
        graphics.lineTo(edge.end.x * width, edge.end.y * height);
      });
      graphics.lineStyle(0, 0xffffff, 1);
    });
    graphics.endFill();
  }
}
