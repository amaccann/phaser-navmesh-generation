import { Color, Line, Point, Polygon } from 'phaser-ce';
import MarchingSquares from './marchingSquares';
import Cluster from './cluster';

const timerName = 'Finding clusters with Marching Squares:';
let graphics;

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

export default class TileLayerClusters extends MarchingSquares {
  constructor(game, tileLayer, options = {}) {
    const { data } = tileLayer.layer;
    super(data, options.collisionIndices);

    this.game = game;
    this.debug = options.debug;
    this.tileLayer = tileLayer;

    this.generate();
  }

  /**
   * @method generate
   */
  generate() {
    console.time(timerName);
    const { grid, collisionIndices } = this;

    this.clusters = [];
    super.generate((contours, edges) => {
      this.clusters.push(new Cluster(contours, edges, grid, collisionIndices));
    });

    console.warn('Clusters generated', this.clusters);
    if (this.debug.marchingSquares) {
      this.renderDebug();
    }
    console.timeEnd(timerName);
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
    const { width, height } = this.tileDimensions;

    function mapPolygonToWorld(point) {
      return {
        x: point.x * width,
        y: point.y * height
      };
    }

    function drawClusterEdge(edge) {
      //const lineColour = Color.HSLtoRGB(Math.random(), 1, 0.5).color;
      graphics.lineStyle(3, 0x0000ff, 1);
      graphics.moveTo(edge.start.x * width, edge.start.y * height);
      graphics.lineTo(edge.end.x * width, edge.end.y * height);
    }

    if (!graphics) {
      graphics = game.add.graphics(0, 0);
    } else {
      graphics.clear();
    }

    graphics.lineStyle(0, 0xffffff, 1);
    clusters.forEach(cluster => {
      graphics.beginFill(0xff0000, 0.5);
      graphics.drawPolygon(cluster.polygon.points.map(mapPolygonToWorld));
      graphics.endFill();

      cluster.clusters.forEach(c => {
        graphics.beginFill(0xff00ff, 0.5);
        graphics.drawPolygon(c.points.map(mapPolygonToWorld));
        graphics.endFill();

        c.edges.forEach(drawClusterEdge)
      });

      cluster.edges.forEach(drawClusterEdge);
    });
  }
}
