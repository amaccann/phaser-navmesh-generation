const defaultOptions = {
  marchingSquares: false,
  navMesh: true,
  navMeshNodes: false,
  aStar: true
};

class Debug {
  constructor(options = {}) {
    this.set(options);
  }

  set(options = {}) {
    this.settings = Object.assign({}, defaultOptions, {});
    return this.settings;
  }
}

export default new Debug()