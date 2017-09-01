import { Line, Point } from 'phaser-ce';

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

export function getHeuristicCost(poly1, poly2) {
  const d1 = Math.abs(poly2.centroid.x - poly1.centroid.x);
  const d2 = Math.abs(poly2.centroid.y - poly1.centroid.y);

  return d1 + d2;
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
    return new Line(end.x, end.y, start.x, start.y);
  } else if (end.x > start.x) {
    return line;
  } else if (end.y < start.y) {
    return new Line(end.x, end.y, start.x, start.y);
  }
  return line;
}

/**
 * @method offsetFunnelPath
 * @description Offset the funnel path by ${inflateBy} so steering doesn't get too close to the corners
 * @description Concept taken from http://ahamnett.blogspot.ie/2012/10/funnel-algorithm.html
 * @param {Phaser.Point[]} paths
 * @param {number} inflateBy
 */
export function offsetFunnelPath(paths = [], inflateBy = 32) {
  const length = paths.length;
  if (!length) {
    return [];
  }

  const inflated = [ paths[0].clone() ];
  let i = 0;
  let previousCurrent;
  let nextCurrent;
  let clockwise;
  let distance;
  let previous;
  let current;
  let next;
  let area;

  for (i; i < length; i++) {
    current = paths[i];
    previous = paths[i - 1];
    next = paths[i + 1];

    // Ignore the start & end vertices
    if (!previous || !next) {
      continue;
    }

    previousCurrent = new Line(previous.x, previous.y, current.x, current.y);
    nextCurrent = new Line(current.x, current.y, next.x, next.y);

    // Get the area of the poly formed by the 3 points; if it's negative the path bends clockwise
    area = triarea2(previous, current, next);
    clockwise = area <= 0;
    distance = nextCurrent.angle - previousCurrent.angle;

    if (Math.abs(distance) > Math.PI) {
      distance -= distance > 0 ? Math.PI * 2 : -Math.PI;
    }

    // Calculate the perpendicular to average angle.
    const angle = previousCurrent.angle + (distance / 2) + (Math.PI / 2);
    const normal = new Point(Math.cos(angle) * inflateBy, Math.sin(angle) * inflateBy);

    if (clockwise) {
      inflated.push(Point.subtract(paths[i], normal));
    } else {
      inflated.push(Point.add(paths[i], normal));
    }
  }
  inflated.push(paths[length - 1].clone());

  return inflated;
}
