const defaultOptions = {
  marchingSquares: false,
  navMesh: false,
  navMeshNodes: false,
  polygonBounds: false,
  aStar: false
};

class Debug {
  constructor(options = {}) {
    this.set(options);
  }

  set(options = {}) {
    this.settings = Object.assign({}, defaultOptions, options);
    return this.settings;
  }
}

export default new Debug()