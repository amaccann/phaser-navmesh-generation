const defaultConfig = {
  collisionIndices: [],
  midPointThreshold: 0,
  tileMap: null,
  tileLayer: null,
};

class Config {
  constructor() {
    this._c = {...defaultConfig};
  }

  /**
   * @method collisionIndices
   * @return {Object}
   */
  get collisionIndices() {
    return this._c.collisionIndices || [];
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
   * @method midPointThreshold
   * @return {Object}
   */
  get midPointThreshold() {
    return this._c.midPointThreshold;
  }

  /**
   * @method tileLayer
   * @return {Object}
   */
  get tileLayer() {
    return this._c.tileLayer;
  }

  /**
   * @method set
   * @param {Object} config
   */
  set(config = defaultConfig) {
    this._c = { ...defaultConfig, ...config };
  }
}

export default new Config();