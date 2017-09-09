const types = [
  'hulls',
  'navMesh',
  'navMeshNodes',
  'polygonBounds',
  'aStarPath'
];

const DEBUG_DIAMETER = 10;
const DEBUG_COLOUR_YELLOW = 0xffff00;
const DEBUG_COLOUR_ORANGE = 0xffa500;
const DEBUG_COLOUR_GREEN = 0x33ff33;
const DEBUG_COLOUR_RED = 0xff3333;
const DEBUG_PORTAL_WIDTH = 2;

const defaultOptions = {};
types.forEach(type => defaultOptions[type] = false);

class Debug {
  constructor(options = {}) {
    this.gfx = {};
    this.set(null, null, options);
  }

  /**
   * @method draw
   */
  draw({ delaunay, aStarPath }) {
    const { settings } = this;
    const { hulls, navMesh, navMeshNodes, polygonBounds } = settings;
    this.initGraphics();

    if ((hulls || navMesh || navMeshNodes || polygonBounds) && delaunay) {
      this.drawDelaunay(delaunay);
    }

    if (settings.aStarPath && aStarPath) {
      this.drawAStarPath(aStarPath);
    }
  }

  /**
   * @method tileDimensions
   */
  get tileDimensions() {
    const { data } = this.tileLayer.layer;
    const tile = data[0][0];
    const { width, height } = tile;

    return { width, height };
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
   * @method drawAStarPath
   */
  drawAStarPath(aStarPath) {
    const { gfx } = this;
    const aStarGraphics = gfx.aStarPath;
    const { startPoint, endPoint } = aStarPath;

    aStarGraphics.clear();
    aStarGraphics.beginFill(DEBUG_COLOUR_ORANGE, 1);
    aStarGraphics.lineStyle(DEBUG_PORTAL_WIDTH, DEBUG_COLOUR_ORANGE, 1);
    aStarPath.polygons.forEach(poly =>
      aStarGraphics.drawCircle(poly.centroid.x, poly.centroid.y, DEBUG_DIAMETER));
    aStarPath.portals.forEach(portal => {
      aStarGraphics.moveTo(portal.start.x, portal.start.y);
      aStarGraphics.lineTo(portal.end.x, portal.end.y);
    });
    aStarGraphics.endFill();

    aStarGraphics.lineStyle(0, 0xffffff, 1);
    aStarGraphics.beginFill(DEBUG_COLOUR_RED, 1);
    aStarGraphics.drawCircle(startPoint.x, startPoint.y, DEBUG_DIAMETER);
    aStarGraphics.endFill();

    aStarGraphics.lineStyle(0, 0xffffff, 1);
    aStarGraphics.beginFill(DEBUG_COLOUR_GREEN, 1);
    aStarGraphics.drawCircle(endPoint.x, endPoint.y, DEBUG_DIAMETER);
    aStarGraphics.endFill();
  }

  /**
   * @method drawDelaunay
   */
  drawDelaunay(delaunay) {
    const { settings } = this;
    const { hulls, navMesh, navMeshNodes, polygonBounds } = this.gfx;
    const { polygons } = delaunay;
    const { clusters } = delaunay.hulls;

    /**
     * @method Render the Delaunay triangles generated...
     */
    if (settings.navMesh) {
      navMesh.clear();
      navMesh.beginFill(0xff33ff, 0.25);
      navMesh.lineStyle(1, 0xffffff, 1);
      polygons.forEach(poly => navMesh.drawPolygon(poly.points));
      navMesh.endFill();
    }

    function drawCluster(cluster) {
      hulls.beginFill(0xff0000, 0.5);
      hulls.drawPolygon(cluster.polygon.points.map(this.getWorldXY, this));
      hulls.endFill();
      const [startEdge, ...otherEdges] = cluster.edges;
      const startEdgeStart = this.getWorldXY(startEdge.start);
      const startEdgeEnd = this.getWorldXY(startEdge.end);

      hulls.lineStyle(2, DEBUG_COLOUR_YELLOW);
      hulls.moveTo(startEdgeStart.x, startEdgeStart.y);
      hulls.lineTo(startEdgeEnd.x, startEdgeEnd.y);

      otherEdges.forEach(edge => {
        const start = this.getWorldXY(edge.start);
        const end = this.getWorldXY(edge.end);

        hulls.moveTo(start.x, start.y);
        hulls.lineTo(end.x, end.y);
      });
      hulls.lineStyle(0);

      if (cluster.children.length) {
        cluster.children.forEach(drawCluster, this);
      }
    }

    /**
     * @description Render the hulls found using the Marching Squares algorithm
     */
    if (settings.hulls) {
      hulls.clear();
      clusters.forEach(drawCluster, this);
    }

    /**
     * @description Render the connecting NavMesh nodes between triangles
     */
    if (settings.navMeshNodes) {
      const lineWidth = 3;

      navMeshNodes.clear();
      navMeshNodes.lineStyle(lineWidth, 0x00b2ff, 0.5);
      polygons.forEach((poly) => {
        poly.neighbors.forEach((neighbour) => {
          navMeshNodes.moveTo(poly.centroid.x, poly.centroid.y);
          navMeshNodes.lineTo(neighbour.centroid.x, neighbour.centroid.y);
        });

        navMeshNodes.beginFill(0xffffff);
        navMeshNodes.drawCircle(poly.centroid.x, poly.centroid.y, DEBUG_DIAMETER);
        navMeshNodes.endFill();
      });
    }

    /**
     * @description Render the bounding circles of each NavMesh triangle
     */
    if (settings.polygonBounds) {
      polygonBounds.clear();
      polygons.forEach(polygon => {
        polygonBounds.lineStyle(2, DEBUG_COLOUR_YELLOW, 1);
        polygonBounds.drawCircle(polygon.centroid.x, polygon.centroid.y, polygon.boundsRadius * 2)
      });
      polygonBounds.lineStyle(0, 0xffffff);
    }
  }

  /**
   * @method initGraphics
   */
  initGraphics() {
    const { game, gfx } = this;
    types.forEach(type => {
      if (!gfx[type]) {
        gfx[type] = game.add.graphics(0, 0);
      }
    });
  }

  /**
   * @set
   * @param {Phaser.Game} game
   * @param {Phaser.TilemapLayer} tileLayer
   * @param {Object} options
   */
  set(game, tileLayer, options = {}) {
    this.game = game;
    this.tileLayer = tileLayer;
    this.settings = Object.assign({}, defaultOptions, options);
    if (game) {
      this.initGraphics();
    }

    return this.settings;
  }
}

export default new Debug()