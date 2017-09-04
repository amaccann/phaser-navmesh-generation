import AStarPath from './aStarPath';
import Debug from './debug';
import NavMeshPolygon from './navMeshPolygon';
import PriorityQueue from './priorityQueue';
import { getHeuristicCost } from './utils';
import NavMesh from './navMesh';

let DEBUG_GRAPHICS;
const DEBUG_CENTROID_DIAMETER = 10;
const DEBUG_COLOUR_ORANGE = 0xffa500;
const DEBUG_COLOUR_GREEN = 0x33ff33;
const DEBUG_COLOUR_RED = 0xff3333;
const DEBUG_PORTAL_WIDTH = 2;
const SEARCH_CEILING = 1000;

export default class AStar {
  /**
   * @constructor
   * @param {Phaser.Game} game
   * @param {NavMesh} navMesh
   */
  constructor(game, navMesh) {
    this.game = game;
    this.navMesh = navMesh;
  }

  /**
   * @method search
   * @description Taken from http://jceipek.com/Olin-Coding-Tutorials/pathing.html
   * @param {Phaser.Point} start
   * @param {Phaser.Point} end
   * @returns NavMeshPolygon[]
   */
  search(start, end) {
    const startPolygon = this.navMesh.getPolygonByXY(start.x, start.y);
    const endPolygon = this.navMesh.getPolygonByXY(end.x, end.y);
    const pathNodes = [];

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

    frontier.push(startPolygon, getHeuristicCost(startPolygon, endPolygon));

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
          // gCost[connectedNode.uuid] = gCost[leafNode.uuid] + CostBetween(leafNode, connectedNode);
          gCost[connectedNode.uuid] = gCost[leafNode.uuid] + getHeuristicCost(leafNode, connectedNode);
          pathTo[connectedNode.uuid] = leafNode;
          frontier.push(connectedNode, gCost[connectedNode.uuid] + getHeuristicCost(connectedNode, endPolygon));
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
    const { game } = this;
    const aStarPath = new AStarPath(game, pathNodes, { startPoint, endPoint, startPolygon, endPolygon, isConnected });

    if (Debug.settings.aStar) {
      this.debugAStar(aStarPath);
    }

    return aStarPath;
  }

  /**
   * @method debugAStar
   * @param {AStarPath} aStarPath
   */
  debugAStar(aStarPath) {
    const { game } = this;
    const { startPoint, endPoint } = aStarPath;
    if (DEBUG_GRAPHICS) {
      DEBUG_GRAPHICS.clear();
    } else {
      DEBUG_GRAPHICS = game.add.graphics(0, 0);
      game.world.bringToTop(DEBUG_GRAPHICS);
    }

    DEBUG_GRAPHICS.clear();
    DEBUG_GRAPHICS.beginFill(DEBUG_COLOUR_ORANGE, 1);
    DEBUG_GRAPHICS.lineStyle(DEBUG_PORTAL_WIDTH, DEBUG_COLOUR_ORANGE, 1);
    aStarPath.polygons.forEach(poly =>
      DEBUG_GRAPHICS.drawCircle(poly.centroid.x, poly.centroid.y, DEBUG_CENTROID_DIAMETER));
    aStarPath.portals.forEach(portal => {
      DEBUG_GRAPHICS.moveTo(portal.start.x, portal.start.y);
      DEBUG_GRAPHICS.lineTo(portal.end.x, portal.end.y);
    });
    DEBUG_GRAPHICS.endFill();

    DEBUG_GRAPHICS.lineStyle(0, 0xffffff, 1);
    DEBUG_GRAPHICS.beginFill(DEBUG_COLOUR_RED, 1);
    DEBUG_GRAPHICS.drawCircle(startPoint.x, startPoint.y, DEBUG_CENTROID_DIAMETER);
    DEBUG_GRAPHICS.endFill();

    DEBUG_GRAPHICS.lineStyle(0, 0xffffff, 1);
    DEBUG_GRAPHICS.beginFill(DEBUG_COLOUR_GREEN, 1);
    DEBUG_GRAPHICS.drawCircle(endPoint.x, endPoint.y, DEBUG_CENTROID_DIAMETER);
    DEBUG_GRAPHICS.endFill();
  }
}
