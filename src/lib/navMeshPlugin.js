import { Plugin } from 'phaser-ce';
import NavMesh from './navMesh';

const defaultOptions = {
  debug: {
    marchingSquares: true,
    navMesh: true,
    navMeshNodes: false,
    aStar: true
  },
  collisionIndices: []
};

export default class NavMeshPlugin extends Plugin {
  constructor(game, manager) {
    super(game, manager);
  }

  buildFromTileLayer(tileMap, tileLayer, options = {}) {
    return new NavMesh(this.game, tileMap, tileLayer, Object.assign({}, defaultOptions, options));
  }
}