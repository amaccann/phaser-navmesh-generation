const defaultConfig = {
  collisionIndices: [],
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
  }
}

export default new Config();