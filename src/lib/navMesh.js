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

import TileLayerClusters from './tileLayerClusters';

const SUB_DIVISION_DEFAULT = 4;
const diameter = 10;
const font = 'carrier_command';
let PATH_GRAPHICS;

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
    this.debug = options.debug;
    this.subDivisions = options.subDivisions || SUB_DIVISION_DEFAULT;
    this.collisionIndices = options.collisionIndices || [];

    const tileLayerClusters = new TileLayerClusters(game, tileLayer, {
      debug: this.debug,
      collisionIndices: this.collisionIndices
    });

/*
    this.extractAllPointsFromHulls();
    this.generateDelaunayTriangulation();
    this.generatePolygonEdges();
*/

    /*
        if (debug.navMesh.navMesh) {
          this.renderHulls();
          this.renderMesh();
        }

        if (debug.navMesh.navMeshNodes) {
          this.renderNodes();
        }
    */
  }

  /**
   * @method destroy
   */
  destroy() {
    // @TODO - Destroy when unloading states etc.
    //this.polygons.forEach((polygon: NavMeshPolygon) => polygon.destroy());
  }

  /**
   * @method getPath
   */
  getPath(startPosition, endPosition, offset) {
    const { aStar } = this;
    const aStarPath = aStar.search(startPosition, endPosition);
    const path = aStarPath.path;
    const offsetPath = offsetFunnelPath(path, offset);

// if (debug.navMesh.aStar) {
//   this.renderFinalOffsetPath(offsetPath);
// }

    return offsetPath;
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
  extractAllPointsFromHulls() {
    const { points, subDivisions, tileLayer } = this;
    const { widthInPixels, heightInPixels } = this.tileMap;
    const subWidth = Math.floor(widthInPixels / subDivisions);
    const subHeight = Math.floor(heightInPixels / subDivisions);
    let x = 0;
    let width;
    let height;

    points.push([0, 0]);
    points.push([widthInPixels, 0]);
    points.push([0, heightInPixels]);
    points.push([widthInPixels, heightInPixels]);

    for (x; x < subDivisions; x++) {
      width = subWidth * x;
      height = subHeight * x;

      points.push([ width, 0 ]);
      points.push([ width, heightInPixels ]);
      points.push([ 0, height ]);
      points.push([ widthInPixels, height ]);
    }

    this.hulls = phaserTiledHull(tileLayer, { tileIndices: collisionIndices });
    this.hulls.forEach((hullShape) => {
      hullShape.forEach((lineData) => {
        const { line } = lineData;
        this.points.push([ line.start.x, line.start.y ]);
        this.points.push([ line.end.x, line.end.y ]);
      }, this);
    }, this);
  }

  /**
   * @method generateDelaunayTriangulation
   */
  generateDelaunayTriangulation() {
    const { game, points } = this;
    const delaunator = new Delaunator(points);
    const { triangles } = delaunator;
    const length = delaunator.triangles.length;
    const result = [];
    let i = 0;
    let polygon;

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
        if (!polygon.isOtherPolygonInRadius(otherPolygon)) {
          continue;
        }

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
    const { tileMap, tileLayer } = this;
    const { tileWidth, tileHeight } = tileMap;

    const tileX = ~~(centroid.x / tileWidth);
    const tileY = ~~(centroid.y / tileHeight);

    const tile = tileLayer.layer.data[tileY][tileX];

    return !tile || collisionIndices.indexOf(tile.index) === -1;
  }

  /**
   * @method drawHulls
   */
  renderHulls() {
    const { hulls, game } = this;
    const overlay = game.add.graphics(0, 0);

    for (const poly of hulls) {
      const polyColor = Color.HSLtoRGB(Math.random(), 1, 0.5).color;

      for (const edge of poly) {
        // Draw the edge
        overlay.lineStyle(5, polyColor, 1);
        overlay.moveTo(edge.line.start.x, edge.line.start.y);
        overlay.lineTo(edge.line.end.x, edge.line.end.y);

        // Draw the normal at the midpoint of the edge
        const normalStart = edge.midpoint;
        const normalEnd = Point.add(normalStart, edge.normal.setMagnitude(20));

        overlay.lineStyle(1, polyColor, 1);
        overlay.moveTo(normalStart.x, normalStart.y);
        overlay.lineTo(normalEnd.x, normalEnd.y);
      }
    }
  }

  /**
   * @method renderMesh
   */
  renderMesh() {
    const { game, polygons } = this;
    const graphics = game.add.graphics(0, 0);

    // @TEMP render, to review the generated triangles
    graphics.alpha = 0.3;
    graphics.beginFill(0xff33ff);
    graphics.lineStyle(1, 0xffd900, 1);
    polygons.forEach((poly) => graphics.drawPolygon(poly.points));
    graphics.endFill();
  }

  /**
   * @method renderNodes
   */
  renderNodes() {
    const { game, polygons } = this;
    const graphics = game.add.graphics(0, 0);

    graphics.lineStyle(5, 0x0000ff, 0.5);
    polygons.forEach((poly) => {
      poly.neighbors.forEach((neighbour) => {
        graphics.moveTo(poly.centroid.x, poly.centroid.y);
        graphics.lineTo(neighbour.centroid.x, neighbour.centroid.y);
      });

      graphics.beginFill(0xffffff);
      graphics.drawCircle(poly.centroid.x, poly.centroid.y, diameter);
      graphics.endFill();
    });
  }

  /**
   * @method renderFinalOffsetPath
   */
  renderFinalOffsetPath(path = []) {
    if (!path.length) {
      return;
    }

    if (!PATH_GRAPHICS) {
      PATH_GRAPHICS = this.game.add.graphics(0, 0);
    } else {
      PATH_GRAPHICS.clear();
    }
    const [start, ...otherPoints] = path;
    PATH_GRAPHICS.moveTo(start.x, start.y);
    PATH_GRAPHICS.lineStyle(4, 0x0000ff, 1);
    otherPoints.forEach((point) => PATH_GRAPHICS.lineTo(point.x, point.y));
    PATH_GRAPHICS.lineStyle(0, 0xffffff, 1);
  }
}
