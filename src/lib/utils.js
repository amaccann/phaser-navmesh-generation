import EdgePoint from './delaunay/edgePoint';
import Config from './config';

const THREE_SIXTY_DEGREES = Math.PI * 2;

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
  const start = line.getPointA();
  const end = line.getPointB();
  if (end.x < start.x) {
    return new Phaser.Geom.Line(end.x, end.y, start.x, start.y);
  } else if (end.x > start.x) {
    return line;
  } else if (end.y < start.y) {
    return new Phaser.Geom.Line(end.x, end.y, start.x, start.y);
  }
  return line;
}

/**
 * @function getCrossProduct
 * @description Calculate the cross-product between a corner (3 points)
 * @param {Phaser.Geom.Point} point
 * @param {Phaser.Geom.Point} previous
 * @param {Phaser.Geom.Point} next
 */
export function getCrossProduct(point, previous, next) {
  const vector1 = new Phaser.Math.Vector2(point.x - previous.x, point.y - previous.y);
  const vector2 = new Phaser.Math.Vector2(point.x - next.x, point.y - next.y);
  return vector1.cross(vector2);
}

/**
 * @method getDotProduct
 * @description Calculate the dot-product between a corner
 * @param {Phaser.Geom.Point} point
 * @param {Phaser.Geom.Point} previous
 * @param {Phaser.Geom.Point} next
 */
export function getDotProduct(point, previous, next) {
  const normal1 = new Phaser.Math.Vector2(previous.x - point.x, previous.y - point.y).normalize();
  const normal2 = new Phaser.Math.Vector2(next.x - point.x, next.y - point.y).normalize();
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
  console.log('paths', paths);

  const inflated = [ new Phaser.Math.Vector2(paths[0].x, paths[0].y) ];
  const offsetPoint = new Phaser.Math.Vector2();
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
      inflated.push(new Phaser.Math.Vector2(current.x, current.y));
      continue;
    }

    nextCurrent = new Phaser.Geom.Line(current.x, current.y, next.x, next.y);

    cross = getCrossProduct(current, previous, next);
    dot = getDotProduct(current, previous, next);
    isAntiClockwise = cross >= 0;
    angle = Math.acos(dot) * (isAntiClockwise ? -1 : 1);

    // Rotate the line segment between current & next points by half the vertex angle; then extend this segment
    // See: https://stackoverflow.com/questions/8292508/algorithm-for-extending-a-line-segment
    const rotated = Phaser.Geom.Line.RotateAroundPoint(Phaser.Geom.Line.Clone(nextCurrent), current, angle / 2);
    const start = rotated.getPointA();
    const end = rotated.getPointB();
    const length = Phaser.Geom.Line.Length(rotated);
    offsetPoint.x = start.x + (start.x - end.x) / length * inflateBy;
    offsetPoint.y = start.y + (start.y - end.y) / length * inflateBy;

    console.log('offsetPoint', offsetPoint);
    inflated.push(new Phaser.Math.Vector2(offsetPoint.x, offsetPoint.y))
  }

  // Add the last point, without inflating it
  inflated.push(new Phaser.Math.Vector2(paths[length - 1]));

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

    const line1Start = line1.getPointA();
    const line1End = line1.getPointB();
    const line2Start = line2.getPointA();
    const line2End = line2.getPointB();
    const area = triarea2(line1Start, line1End, line2End);
    line = new Phaser.Geom.Line(line1Start.x, line1Start.y, line2End.x, line2End.y);
    if (!area) {
      edges.splice(i, 2, line);
      i--; // start again
    }
  }

  return edges;
}

/**
 * @method offsetPolygon
 * @param {Phaser.Geom.Point[]} points
 * @param {Boolean} invert
 * @param {Cluster[]} clusters
 */
export function offsetPolygon(points = [], invert, clusters = []) {
  const { width, height } = Config.mapDimensions;
  const offsetBy = Config.get('offsetHullsBy') * (invert ? -1 : 1);
  const pointsLength = points.length;
  const offsetPoint = new Phaser.Math.Vector2();
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
    nextCurrent = new Phaser.Geom.Line(current.x, current.y, next.x, next.y);
    area = triarea2(previous, current, next);

    dot = getDotProduct(current, previous, next);
    cross = getCrossProduct(current, previous, next);
    isAntiClockwise = cross >= 0;
    angle = Math.acos(dot) * (isAntiClockwise ? -1 : 1);

    if (current.x === 0 || current.y === 0 || current.x === width || current.y === height) {
      continue;
    }

    const rotated = Phaser.Geom.Line.RotateAroundPoint( Phaser.Geom.Line.Clone(nextCurrent), current, (angle / 2))
    const length = Phaser.Geom.Line.Length(rotated);
    const start = rotated.getPointA();
    const end = rotated.getPointB();
    

    if (area < 0) {
      offsetPoint.x = start.x + (end.x - start.x) / length * offsetBy;
      offsetPoint.y = start.y + (end.y - start.y) / length * offsetBy;
    } else {
      offsetPoint.x = start.x - (end.x - start.x) / length * offsetBy;
      offsetPoint.y = start.y - (end.y - start.y) / length * offsetBy;
    }

    // Only update the edge point IF the new offset does NOT overlap with any sibling cluster
    if (!clusters.find(cluster => cluster.polygon.contains(offsetPoint.x, offsetPoint.y))) {
      current.copy(offsetPoint);
    }
  }

  return points;
}

/**
 * @method offsetEdges
 * @param {Phaser.Line[]} edges
 * @param {Boolean} invert
 * @param {Cluster[]} clusters
 */
export function offsetEdges(edges = [], invert = false, clusters = []) {
  const allPoints = [];
  const length = edges.length;
  let i = 0;
  let exists;
  let offsetPoints;

  const addPoint = point => {
    exists = allPoints.find(p => p.equals(point));
    if (exists) {
      exists.addSource(point);
    } else {
      allPoints.push(new EdgePoint(point));
    }
  };

  for (i; i < length; i++) {
    addPoint(edges[i].getPointA());
    addPoint(edges[i].getPointB());
  }

  offsetPoints = offsetPolygon(allPoints, invert, clusters);
  offsetPoints.forEach(point => point.updateSources());

  return edges;
}
