import Config from '../config';

const WHILE_CEILING = 500;
const DIRECTIONS = {
  NONE: 0,
  UP: -1,
  LEFT: -1,
  RIGHT: 1,
  DOWN: 1
};

export default class MarchingSquares {
  /**
   * @method generate
   * @param {Function} onClusterFound
   */
  generate(onClusterFound) {
    let CEILING_LOOP = 0;
    let walked = [];
    let contours;

    // Once generate() returns no points => IE, no new clusters found, break out of the do/while
    do {
      walked = this.walkPerimeter() || {};
      contours = walked.contours || [];

      if (contours.length) {
        onClusterFound(contours, walked.lines);
      }

      CEILING_LOOP++;
      if (CEILING_LOOP >= WHILE_CEILING) {
        break;
      }
    } while (contours.length);
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
    if (this.isValidTile(x - 1, y - 1)) { // UPPER-LEFT
      squareValue += 1;
    }
    // checking upper pixel
    if (this.isValidTile(x, y - 1)) { // UP
      squareValue += 2;
    }

    if (this.isValidTile(x - 1, y)) { // LEFT
      squareValue += 4;
    }

    if (this.isValidTile(x, y)) {
      squareValue += 8;
    }
    return squareValue;
  }

  /**
   * @description MUST be defined by the class extending this
   */
  getStartingPoint() {}

  /**
   * @method get
   */
  get(x, y) {
    return Config.getTileAt(x, y);
  }

  /**
   * @method isValidTile
   * @description MUST be defined in the inheriting class
   */
  isValidTile() {}

  /**
   * @method walkPerimeter
   * @description Find a cluster of colliding tiles, and create a Polygon from these tile coordinates
   */
  walkPerimeter() {
    const startPoint = this.getStartingPoint();
    const currentPoint = new Phaser.Math.Vector2();
    const contours = [];
    const lines = [];
    let clone;
    let LOOP_CEILING = 0;

    if (!startPoint) {
      return null;
    }

    currentPoint.copy(startPoint);
    const step = new Phaser.Math.Vector2();
    const previous = new Phaser.Math.Vector2(); // Save the previous step...

    let closed = false;
    while (!closed) {
      const squareValue = this.getSquareValue(currentPoint);
      switch (squareValue) {
        // UP
        case 1 :
        case 5 :
        case 13 :
          step.setTo(DIRECTIONS.NONE, DIRECTIONS.UP);
          break;
        // DOWN
        case 8 :
        case 10 :
        case 11 :
          step.setTo(DIRECTIONS.NONE, DIRECTIONS.DOWN);
          break;
        // LEFT
        case 4 :
        case 12 :
        case 14 :
          step.setTo(DIRECTIONS.LEFT, DIRECTIONS.NONE);
          break;
        // RIGHT
        case 2 :
        case 3 :
        case 7 :
          step.setTo(DIRECTIONS.RIGHT, DIRECTIONS.NONE);
          break;
        case 6 :
          // SPECIAL DIAGONAL CASE #1
          if (previous.x === DIRECTIONS.NONE && previous.y === DIRECTIONS.UP) {
            step.setTo(DIRECTIONS.LEFT, DIRECTIONS.NONE);
          } else {
            step.setTo(DIRECTIONS.RIGHT, DIRECTIONS.NONE);
          }
          break;
        case 9 :
          // SPECIAL DIAGONAL CASE #2
          if (previous.x === DIRECTIONS.RIGHT && previous.y === DIRECTIONS.NONE) {
            step.setTo(DIRECTIONS.NONE, DIRECTIONS.LEFT);
          } else {
            step.setTo(DIRECTIONS.NONE, DIRECTIONS.RIGHT);
          }
          break;
      }

      clone = currentPoint.clone();
      contours.push(clone); // save contour
      currentPoint.add(step);

      // Create a line from the current point & next one along...
      lines.push(new Phaser.Geom.Line(clone.x, clone.y, currentPoint.x, currentPoint.y));

      previous.copy(step);


      // If we return to first point, loop is done.
      if (currentPoint.equals(startPoint)) {
        closed = true;
      }

      LOOP_CEILING++;
      if (LOOP_CEILING >= WHILE_CEILING) {
        closed = true;
      }
    }

    // If no contour points found, then there were no passing clusters found
    return { contours, lines };
  }
}