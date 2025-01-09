const types = [
  'hulls',
  'navMesh',
  'navMeshNodes',
  'polygonBounds'
];

const DEBUG_DIAMETER = 5;
const DEBUG_COLOUR_YELLOW = 0xffff00;

const defaultOptions = {};
types.forEach(type => defaultOptions[type] = false);

class Debug {
  constructor(options = {}) {
    this.set(null, null, options);
  }

  /**
   * @method draw
   * @param {DelaunayGenerator} delaunay
   */
  draw(delaunay) {
    const { settings } = this;
    const { hulls, navMesh, navMeshNodes, polygonBounds } = settings;
    this.initGraphics();

    if ((hulls || navMesh || navMeshNodes || polygonBounds) && delaunay) {
      this.drawDelaunay(delaunay);
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
   * @param {Phaser.Geom.Point|Object} point
   */
  getWorldXY(point) {
    const { width, height } = this.tileDimensions;
    return {
      x: point.x * width,
      y: point.y * height
    };
  }

  /**
   * @method drawDelaunay
   */
  drawDelaunay(delaunay) {
    const { gfx, settings } = this;
    const { polygons } = delaunay;
    const { allEdges } = delaunay.hulls;
    gfx.clear();

    function drawEdge(edge) {
      gfx.lineStyle(2, DEBUG_COLOUR_YELLOW);
      gfx.moveTo(edge.x1, edge.y1);
      gfx.lineTo(edge.x2, edge.y2);
      gfx.lineStyle(0);
    }

    /**
     * @description Render the hulls found using the Marching Squares algorithm
     */
    if (settings.hulls) {
      allEdges.forEach(drawEdge, this);
    }

    /**
     * @method Render the Delaunay triangles generated...
     */
    if (settings.navMesh) {
      gfx.lineStyle(1, 0xffffff, 1);
      polygons.forEach(({points}) => {
      //  const text = this.scene.add.text(centroid.x, centroid.y, uuid,  { fontFamily: 'Arial', fontSize: 16 });
      //  text.setOrigin(0.5);
        gfx.strokePoints(points);
      });
    }

    /**
     * @description Render the connecting NavMesh nodes between triangles
     */
    if (settings.navMeshNodes) {
      const lineWidth = 3;

      gfx.lineStyle(lineWidth, 0x00b2ff, 1);
      polygons.forEach((poly) => {
        poly.neighbors.forEach(neighbour => {
          gfx.beginPath();
          gfx.moveTo(poly.centroid.x, poly.centroid.y);
          gfx.lineTo(neighbour.centroid.x, neighbour.centroid.y);
          gfx.closePath();
          gfx.strokePath();
        });

        gfx.fillStyle(0xffff00);
        gfx.fillCircle(poly.centroid.x, poly.centroid.y, DEBUG_DIAMETER);
      });
    }

    /**
     * @description Render the bounding circles of each NavMesh triangle
     */
    if (settings.polygonBounds) {
      polygons.forEach(polygon => {
        gfx.lineStyle(2, DEBUG_COLOUR_YELLOW, 1);
        gfx.fillCircle(polygon.centroid.x, polygon.centroid.y, polygon.boundsRadius * 2)
      });
      gfx.lineStyle(0, 0xffffff);
    }
  }

  /**
   * @method initGraphics
   */
  initGraphics() {
    const { scene } = this;
    if (!this.gfx && !!scene) {
      this.gfx = scene.add.graphics(0, 0);
    } else {
      this.gfx.clear();
    }
  }

  /**
   * @set
   * @param {Phaser.Game} scene
   * @param {Phaser.TilemapLayer} tileLayer
   * @param {Object} options
   */
  set(scene, tileLayer, options = {}) {
    this.scene = scene;
    this.tileLayer = tileLayer;
    this.settings = Object.assign({}, defaultOptions, options);
    if (scene) {
      this.initGraphics();
    }

    return this.settings;
  }
}

export default new Debug()