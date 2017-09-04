/*
import { debug } from '../../config/debug';
import { Game } from '../../../Game';
import NavMeshPolygon from './navMeshPolygon';
import { collisionIndices } from '../MapsManager';
import AStar from './aStar';
import AStarPath from './aStarPath';
import {areLinesEqual, offsetFunnelPath, sortLine} from './navMeshUtils';
import MarchingSquares from './marchingSquares';
*/

import { Point, Polygon } from 'phaser-ce';
import Delaunator from 'delaunator';
import Delaunay from 'faster-delaunay';

import AStar from './aStar';
import Debug from './debug';
import TileLayerClusters from './tileLayerClusters';
import NavMeshPolygon from './navMeshPolygon';
import { areLinesEqual, getRandomColour, offsetFunnelPath, sortLine } from './utils';

const SUB_DIVISION_DEFAULT = 4;
const diameter = 10;
const font = 'carrier_command';
let MESH_GRAPHICS;
let NODES_GRAPHICS;
let BOUNDS_GRAPHICS;

/**
 * @class NavMesh
 * @description TODO: Establish a stronger algorithm to generate hulls, ideally something usning
 *              The Marching Squares algorithm to better establish 'block' areas, gaps etc. Currently
 *              the Phaser, phaserTiledHull plugin ain't the best...
 */
export default class NavMesh {
  constructor(game, tileMap, tileLayer, options = {}) {
    this.game = game;
    this.tileMap = tileMap;
    this.tileLayer = tileLayer;

    this.points = [];
    this.polygons = [];

    this.generate(options);
  }

  /**
   * @method addToDelaunayPoints
   * @param {Phaser.Point} point
   */
  addToDelaunayPoints(point) {
    const { points, tileMap } = this;
    const { tileWidth, tileHeight } = tileMap;
    const { x, y } = point;

    const exists = points.find(p => p[0] === x * tileWidth && p[1] === y * tileHeight);
    if (!exists) {
      points.push([ x * tileWidth, y * tileHeight ]);
    }
  }

  /**
   * @method destroy
   */
  destroy() {
    // @TODO - Destroy when unloading states etc.
    //this.polygons.forEach((polygon: NavMeshPolygon) => polygon.destroy());
    // MESH_GRAPHICS.destroy();
  }

  /**
   * @method generate
   * @param {Object} options
   */
  generate(options) {
    this.setOptions(options);

    const { collisionIndices, game, tileLayer } = this;
    this.tileLayerClusters = new TileLayerClusters(game, tileLayer, { collisionIndices });

    this.extractAllPointsFromClusters();
    this.generateDelaunayTriangulation();
    this.generatePolygonEdges();

    if (Debug.settings.navMesh) {
      this.renderMesh();
    }

    if (Debug.settings.navMeshNodes) {
      this.renderNodes();
    }

    if (Debug.settings.renderBoundingRadii) {
      this.renderBoundingRadii();
    }
  }

  /**
   * @method getPath
   */
  getPath(startPosition, endPosition, offset) {
    const { aStar } = this;
    const aStarPath = aStar.search(startPosition, endPosition);
    const path = aStarPath.path;
    const offsetPath = offsetFunnelPath(path, offset);

    return { path, offsetPath };
  }

  /**
   * @method getPolygonByXY
   */
  getPolygonByXY(x, y) {
    return this.polygons.find(polygon => polygon.contains(x, y));
  }

  /**
   * @method extractAllPointsFromHulls
   * @TODO - Update this to use Marching Squares instead of 3rd party plugin
   */
  extractAllPointsFromClusters() {
    const { subDivisions, tileLayerClusters } = this;
    const { clusters } = tileLayerClusters;
    const { widthInPixels, heightInPixels } = this.tileMap;
    const subWidth = Math.floor(widthInPixels / subDivisions);
    const subHeight = Math.floor(heightInPixels / subDivisions);
    let x = 0;
    let width;
    let height;

    this.points = [];
    this.points.push([0, 0]);
    this.points.push([widthInPixels, 0]);
    this.points.push([0, heightInPixels]);
    this.points.push([widthInPixels, heightInPixels]);

    for (x; x < subDivisions; x++) {
      width = subWidth * x;
      height = subHeight * x;

      this.points.push([ width, 0 ]);
      this.points.push([ width, heightInPixels ]);
      this.points.push([ 0, height ]);
      this.points.push([ widthInPixels, height ]);
    }

    clusters.forEach(cluster => {
      cluster.edges.forEach(line => {
        this.addToDelaunayPoints(line.start);
        this.addToDelaunayPoints(line.end);
      }, this);
    }, this);
  }

  /**
   * @method generateDelaunayTriangulation
   */
  generateDelaunayTriangulation() {
    const { game, points } = this;
    const delaunay = new Delaunay(points);
    const delaunator = new Delaunator(points);
    const { triangles } = delaunator;

    const length = delaunator.triangles.length;
    const result = [];
    let i = 0;
    let polygon;

    this.polygons = [];

    // @TODO - Check if any of these triangles overlap an existing tile
    for (i; i < length; i += 3) {
      result.push([
        points[triangles[i]],
        points[triangles[i + 1]],
        points[triangles[i + 2]]
      ]);

      polygon = new NavMeshPolygon(game, ([]).concat(points[triangles[i]], points[triangles[i + 1]], points[triangles[i + 2]]));

      if (this.isCentroidOverValidTile(polygon.centroid)) {
        this.polygons.push(polygon);
      }
    }
  }

  /**
   * @method generatePolygonEdges
   * @description Find all the other polys each one connects to.
   * @TODO Mine makes a few assumptions that the generated polygons are already connected in some way, given
   * it was generation by the Delaunay algorithm.
   */
  generatePolygonEdges() {
    const { game, polygons } = this;
    const polyLength = polygons.length;
    let i = 0;
    let polygon;
    let otherPolygon;

    for (i; i < polyLength; i++) {
      polygon = polygons[i];

      for (let j = i + 1; j < polyLength; j++) {
        otherPolygon = polygons[j];

        for (const edge of polygon.edges) {
          for (const otherEdge of otherPolygon.edges) {

            if (!areLinesEqual(edge, otherEdge)) {
              continue;
            }

            const { start, end } = sortLine(edge);

            polygon.addNeighbor(otherPolygon);
            otherPolygon.addNeighbor(polygon);

            polygon.addPortalFromEdge(edge, start, end);
            otherPolygon.addPortalFromEdge(otherEdge, start, end);
          }
        }
      }
    }

    this.aStar = new AStar(game, this); // Calculate the a-star grid for the polygons.
  }

  /**
   * @method isCentroidOverValidTile
   */
  isCentroidOverValidTile(centroid) {
    const { collisionIndices, tileMap, tileLayer } = this;
    const { tileWidth, tileHeight } = tileMap;

    const tileX = ~~(centroid.x / tileWidth);
    const tileY = ~~(centroid.y / tileHeight);

    const tile = tileLayer.layer.data[tileY][tileX];

    return !tile || collisionIndices.indexOf(tile.index) === -1;
  }

  /**
   * @method renderMesh
   * @description Debug render the Delaunay generated Triangles
   */
  renderMesh() {
    const { game, polygons } = this;
    if (MESH_GRAPHICS) {
      MESH_GRAPHICS.clear();
    } else {
      MESH_GRAPHICS = game.add.graphics(0, 0);
    }

    MESH_GRAPHICS.alpha = 0.3;
    MESH_GRAPHICS.beginFill(0xff33ff);
    MESH_GRAPHICS.lineStyle(1, 0xffffff, 1);
    polygons.forEach(poly => MESH_GRAPHICS.drawPolygon(poly.points));
    MESH_GRAPHICS.endFill();
  }

  /**
   * @method renderNodes
   */
  renderNodes() {
    const { game, polygons } = this;
    if (!NODES_GRAPHICS) {
      NODES_GRAPHICS = game.add.graphics(0, 0);
    } else {
      NODES_GRAPHICS.clear();
    }

    NODES_GRAPHICS.lineStyle(5, 0x00b2ff, 0.5);
    polygons.forEach((poly) => {
      poly.neighbors.forEach((neighbour) => {
        NODES_GRAPHICS.moveTo(poly.centroid.x, poly.centroid.y);
        NODES_GRAPHICS.lineTo(neighbour.centroid.x, neighbour.centroid.y);
      });

      NODES_GRAPHICS.beginFill(0xffffff);
      NODES_GRAPHICS.drawCircle(poly.centroid.x, poly.centroid.y, diameter);
      NODES_GRAPHICS.endFill();
    });
  }

  /**
   * @method renderBoundingRadii
   */
  renderBoundingRadii() {
    const { centroid, game } = this;
    if (BOUNDS_GRAPHICS) {
      BOUNDS_GRAPHICS.clear();
    } else {
      BOUNDS_GRAPHICS = game.add.graphics(0, 0);
    }


    this.polygons.forEach(polygon => {
      BOUNDS_GRAPHICS.lineStyle(2, getRandomColour(), 1);
      BOUNDS_GRAPHICS.drawCircle(polygon.centroid.x, polygon.centroid.y, polygon.boundsRadius * 2)
    });
    BOUNDS_GRAPHICS.lineStyle(0, 0xffffff);
  }

  /**
   * @method setOptions
   * @param {Object} options
   */
  setOptions(options) {
    Debug.set(options.debug);
    this.subDivisions = options.subDivisions || SUB_DIVISION_DEFAULT;
    this.collisionIndices = options.collisionIndices || [];
  }
}
