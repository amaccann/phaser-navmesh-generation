import AStarPath from './aStarPath';
import PriorityQueue from './priorityQueue';

const SEARCH_CEILING = 1000;

export default class AStar {
  /**
   * @constructor
   * @param {NavMesh} navMesh
   */
  constructor(navMesh) {
    this.navMesh = navMesh;
  }

  /**
   * @method search
   * @description Taken from http://jceipek.com/Olin-Coding-Tutorials/pathing.html
   * @param {Phaser.Point} start
   * @param {Phaser.Point} end
   * @returns {NavMeshPolygon[]|Boolean}
   */
  search(start, end) {
    const { navMesh } = this;
    const startPolygon = navMesh.getPolygonByXY(start.x, start.y);
    const endPolygon = navMesh.getPolygonByXY(end.x, end.y);
    const pathNodes = [];

    if (!startPolygon || !endPolygon) {
      return false;
    }

    const frontier = new PriorityQueue({ low: true }); // Still to explore
    const explored = [];

    const pathTo = {}; // Map keeping track of the path thus far
    const gCost = {}; // Map of the 'G cost' for traveling to each node from starting poly

    let MAIN_LOOP = 0;
    let isConnected = true;
    let i;
    let neighborsLength;
    let leafNode;

    pathTo[startPolygon.uuid] = null;
    gCost[startPolygon.uuid] = 0.0;

    frontier.push(startPolygon, startPolygon.distanceTo(endPolygon));

    while (!frontier.empty()) {
      if (MAIN_LOOP >= SEARCH_CEILING) {
        console.error('TOO MANY WHILE CYCLES - GETTING OUTTA HERE');
        isConnected = false;
        break;
      }

      leafNode = frontier.top();

      // When we find the end poly, reconstruct the path
      if (leafNode === endPolygon) {
        let pointer = endPolygon;

        while (pointer !== null) {
          pathNodes.push(pointer);
          pointer = pathTo[pointer.uuid];
        }

        break;
      }
      frontier.pop();
      explored.push(leafNode);
      neighborsLength = leafNode.neighbors.length;
      i = 0;

      for (i; i < neighborsLength; i++) {
        const connectedNode = leafNode.neighbors[i];
        const isExplored = explored.find(node => node === connectedNode);

        if (!isExplored && !frontier.includes(connectedNode)) {
          gCost[connectedNode.uuid] = gCost[leafNode.uuid] + leafNode.distanceTo(connectedNode);
          pathTo[connectedNode.uuid] = leafNode;
          frontier.push(connectedNode, gCost[connectedNode.uuid] + connectedNode.distanceTo(endPolygon));
        }
      }

      MAIN_LOOP++;
    }

    return this.buildPath(pathNodes, start, end, startPolygon, endPolygon, isConnected);
  }

  /**
   * @method buildPath
   * @param {NavMeshPolygon[]} pathNodes
   * @param {Phaser.Point} startPoint
   * @param {Phaser.Point} endPoint
   * @param {Phaser.Polygon} startPolygon
   * @param {Phaser.Polygon} endPolygon
   * @param {Boolean} isConnected
   */
  buildPath(pathNodes = [], startPoint, endPoint, startPolygon, endPolygon, isConnected) {
    const { navMesh } = this;
    const { midPointThreshold } = navMesh;
    return new AStarPath(pathNodes, { startPoint, endPoint, startPolygon, endPolygon, isConnected, midPointThreshold });
  }
}
