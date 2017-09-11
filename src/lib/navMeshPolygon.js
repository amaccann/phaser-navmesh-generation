import { angleDifference } from './utils';

export default class NavMeshPolygon extends Phaser.Polygon {
  constructor(game, points = []) {
    super(points);

    this.centroid = Phaser.Point.centroid(this.points);
    this.edges = [];
    this.neighbors = [];
    this.portals = [];
    this.uuid = game.rnd.uuid();
    this.initialiseEdges();
    this.initialiseRadius();
  }

  /**
   * @method addNeighbor
   */
  addNeighbor(polygon) {
    this.neighbors.push(polygon);
  }

  /**
   * @method addPortalFromEdge
   * @description build a portal from an edge
   * @param {Phaser.Line} edge
   * @param {Phaser.Point} point1
   * @param {Phaser.Point} point2
   */
  addPortalFromEdge(edge, point1, point2) {
    const { centroid, portals } = this;
    const edgeStartAngle = centroid.angle(edge.start);

    const angleToStart = centroid.angle(point1);
    const angleToEnd = centroid.angle(point2);

    const d1 = angleDifference(edgeStartAngle, angleToStart);
    const d2 = angleDifference(edgeStartAngle, angleToEnd);

    if (d1 > d2) {
      portals.push(new Phaser.Line(point1.x, point1.y, point2.x, point2.y));
    } else {
      portals.push(new Phaser.Line(point2.x, point2.y, point1.x, point1.y));
    }
  }

  /**
   * @method distanceTo
   * @param {NavMeshPolygon} polygon
   * @return {Number}
   */
  distanceTo(polygon) {
    return this.centroid.distance(polygon.centroid);
  }

  /**
   * @method initialiseEdges
   * @description Loop through Polygon points and calculate 'edges' (ie, Lines connecting each vertex)
   */
  initialiseEdges() {
    const { points } = this;
    const length = points.length;
    let i = 0;
    let j;

    for (i; i < length; i++) {
      j = i;

      for (j; j < length; j++) {
        if (i !== j) {
          this.edges.push(new Phaser.Line(points[i].x, points[i].y, points[j].x, points[j].y));
        }
      }
    }
  }

  /**
   * @method initialiseRadius
   */
  initialiseRadius() {
    const { centroid, points } = this;
    const length = points.length;
    let boundingRadius = 0;
    let point;
    let i = 0;
    let d;

    for (i; i < length; i++) {
      point = points[i];
      d = centroid.distance(point);
      if (d > boundingRadius) {
        boundingRadius = d;
      }
    }
    this.boundsRadius = d;
  }
}
