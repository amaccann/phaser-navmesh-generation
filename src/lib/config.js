import MapGrid from './map/grid';

const defaultConfig = {
  collisionIndices: [],
  timingInfo: false,
  midPointThreshold: 0,
  tileMap: null,
  tileLayer: null,
  useMidPoint: false
};

class Config {
  constructor() {
    this._c = {...defaultConfig};
  }

  /**
   * @method get
   * @param {String} key
   */
  get(key) {
    return this._c[key];
  }

  /**
   * @method getTileAt
   * @param {Number} x
   * @param {Number} y
   * @return {MapTile}
   */
  getTileAt(x, y) {
    return MapGrid.getAt(x, y);
  }

  get gridDimensions() {
    const { width, height } = MapGrid;
    return { width, height };
  }

  /**
   * @method mapDimensions
   * @return {Object}
   */
  get mapDimensions() {
    const { width, height, tileWidth, tileHeight, widthInPixels, heightInPixels } = this._c.tileMap;
    return { width, height, tileWidth, tileHeight, widthInPixels, heightInPixels };
  }

  /**
   * @method set
   * @param {Object} config
   */
  set(config = defaultConfig) {
    this._c = { ...defaultConfig, ...config };
    MapGrid.copyFrom(config.tileLayer.layer.data);
  }
}

export default new Config();