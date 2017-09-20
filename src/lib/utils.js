const THREE_SIXTY_DEGREES = Math.PI * 2;

export function areLinesEqual(line1, line2) {
  const line1Start = line1.start;
  const line1End = line1.end;
  const line2Start = line2.start;
  const line2End = line2.end;

  const startEqual = line1Start.equals(line2Start) || line1Start.equals(line2End);
  const endEqual = line1End.equals(line2Start) || line1End.equals(line2End);

  return startEqual && endEqual;
}

export function getRandomColour() {
  return Phaser.Color.HSLtoRGB(Math.random(), 1, 0.5).color;
}

/**
 * @function triarea2
 * @description
 */
export function triarea2(a, b, c) {
  const ax = b.x - a.x;
  const ay = b.y - a.y;
  const bx = c.x - a.x;
  const by = c.y - a.y;

  return bx * ay - ax * by;
}

/**
 * @description https://stackoverflow.com/questions/1878907/the-smallest-difference-between-2-angles
 */
export function angleDifference(x, y) {
  let diff = x - y;
  const i = diff + Math.PI;

  diff = i - Math.floor(i / THREE_SIXTY_DEGREES) * THREE_SIXTY_DEGREES;

  return diff - Math.PI;
}

/**
 * @method sortLine
 * @description Sort a line by its end-points. Prioritise first by the X values, but if they're equal, sort by Y
 */
export function sortLine(line) {
  const { start, end } = line;
  if (end.x < start.x) {
    return new Phaser.Line(end.x, end.y, start.x, start.y);
  } else if (end.x > start.x) {
    return line;
  } else if (end.y < start.y) {
    return new Phaser.Line(end.x, end.y, start.x, start.y);
  }
  return line;
}

/**
 * @function getCrossProduct
 * @description Calculate the cross-product between a corner (3 points)
 * @param {Phaser.Point} point
 * @param {Phaser.Point} previous
 * @param {Phaser.Point} next
 */
export function getCrossProduct(point, previous, next) {
  const vector1 = Phaser.Point.subtract(point, previous);
  const vector2 = Phaser.Point.subtract(point, next);
  return vector1.cross(vector2);
}

/**
 * @method getDotProduct
 * @description Calculate the dot-product between a corner
 * @param {Phaser.Point} point
 * @param {Phaser.Point} previous
 * @param {Phaser.Point} next
 */
export function getDotProduct(point, previous, next) {
  const normal1 = Phaser.Point.subtract(previous, point).normalize();
  const normal2 = Phaser.Point.subtract(next, point).normalize();
  return normal1.dot(normal2);
}

/**
 * @method offsetFunnelPath
 * @description Offset the funnel path by ${inflateBy} so steering doesn't get too close to the corners
 * @param {FunnelPoint[]} paths
 * @param {number} inflateBy
 */
export function offsetFunnelPath(paths = [], inflateBy = 0) {
  const length = paths.length;
  if (!length) {
    return [];
  }

  const inflated = [ paths[0].clone() ];
  const offsetPoint = new Phaser.Point();
  let i = 0;
  let nextCurrent;
  let previous;
  let current;
  let cross;
  let dot;
  let isAntiClockwise;
  let angle;
  let next;

  for (i; i < length; i++) {
    current = paths[i];
    previous = paths[i - 1];
    next = paths[i + 1];

    // Ignore the start & end vertices
    if (!previous || !next) {
      continue;
    } else if (current.isNarrow) { // If this was evaluated as too narrow for funneling, just add it & move on.
      inflated.push(current.clone());
      continue;
    }

    nextCurrent = new Phaser.Line(current.x, current.y, next.x, next.y);

    cross = getCrossProduct(current, previous, next);
    dot = getDotProduct(current, previous, next);
    isAntiClockwise = cross >= 0;
    angle = Math.acos(dot) * (isAntiClockwise ? -1 : 1);

    // Rotate the line segment between current & next points by half the vertex angle; then extend this segment
    // See: https://stackoverflow.com/questions/8292508/algorithm-for-extending-a-line-segment
    const { start, end, length } = nextCurrent.clone().rotateAround(current.x, current.y, (angle / 2));
    offsetPoint.x = start.x + (start.x - end.x) / length * inflateBy;
    offsetPoint.y = start.y + (start.y - end.y) / length * inflateBy;

    inflated.push(offsetPoint.clone());
  }

  // Add the last point, without inflating it
  inflated.push(paths[length - 1].clone());

  return inflated;
}

/**
 * @method optimiseEdges
 * @description Iterate across lines:
 * 1. Check the triarea created by ${i} and the next one along.
 * 2. If zero, then they are lines along the same axis
 * 3. Create a new Line() merge of the two, splice into the array.
 * 3. Restart the iteration from the previous index.
 */
export function optimiseEdges(edges) {
  let i = 0;
  let line;

  for (i; i < edges.length; i++) {
    const line1 = edges[i];
    const line2 = edges[i + 1];
    if (!line2) {
      continue;
    }

    const area = triarea2(line1.start, line1.end, line2.end);
    line = new Phaser.Line(line1.start.x, line1.start.y, line2.end.x, line2.end.y);
    if (!area) {
      edges.splice(i, 2, line);
      i--; // start again
    }
  }

  return edges;
}

/**
 * @method offsetPolygon
 * @param {Phaser.Point[]} points
 * @param {Number} offset
 * @param {Boolean} invert
 */
export function offsetPolygon(points = [], offset, invert) {
  const offsetBy = offset * (invert ? -1 : 1);
  const pointsLength = points.length;
  const inflated = [];
  const offsetPoint = new Phaser.Point();
  let i = 0;
  let current;
  let previous;
  let next;
  let nextCurrent;
  let cross;
  let dot;
  let angle;
  let isAntiClockwise;
  let area;

  for (i; i < pointsLength; i++) {
    previous = points[i === 0 ? pointsLength - 1 : i - 1];
    current = points[i];
    next = points[i === pointsLength - 1 ? 0 : i + 1];
    nextCurrent = new Phaser.Line(current.x, current.y, next.x, next.y);
    area = triarea2(previous, current, next);


    dot = getDotProduct(current, previous, next);
    cross = getCrossProduct(current, previous, next);
    isAntiClockwise = cross >= 0;
    angle = Math.acos(dot) * (isAntiClockwise ? -1 : 1);

    const { start, end, length } = nextCurrent.clone().rotateAround(current.x, current.y, (angle / 2));

    if (area < 0) {
      offsetPoint.x = start.x + (end.x - start.x) / length * offsetBy;
      offsetPoint.y = start.y + (end.y - start.y) / length * offsetBy;
    } else {
      offsetPoint.x = start.x - (end.x - start.x) / length * offsetBy;
      offsetPoint.y = start.y - (end.y - start.y) / length * offsetBy;
    }

    inflated.push(offsetPoint.clone());
  }

  return inflated;
}