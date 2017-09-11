import { Line } from 'phaser-ce';

import Hulls from './hulls';
import NavMeshPolygon from '../navMeshPolygon';
import { areLinesEqual, sortLine } from '../utils';
import DelaunayCluster from './delaunayCluster';

/**
 * @class DelaunayGenerator
 * @description Helper class to generate the delaunay triangles used in building the NavMesh
 */
export default class DelaunayGenerator {
  constructor(game, tileMap) {
    this.game = game;
    this.points = [];
    this.polygons = [];
    this.tileMap = tileMap;
  }

  /**
   * @method generatePolygonEdges
   * @description Find all neighbours for each Polygon generated; we assume all are potentially connected given Delaunay.
   */
  calculateNeighbours() {
    const { polygons } = this;
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
  }

  /**
   * @method generate
   * @description Find (recursively) all outlines of Hulls in the map, and generate Delaunay triangulation from them
   */
  generate(collisionIndices, tileLayer, tileMap) {
    const { game } = this;
    const { tileWidth, tileHeight } = tileMap;

    this.generateHulls(collisionIndices, tileLayer, tileMap);

    const parseCluster = cluster => {
      cluster.children.forEach(childCluster => {
        const parentEdges = cluster.edges;
        const childEdges = childCluster.allChildEdges;
        const { edges } = childCluster;
        const { polygons } = new DelaunayCluster(edges, parentEdges, childEdges, tileWidth, tileHeight, { exterior: false });

        polygons.forEach(poly => {
          this.polygons.push(new NavMeshPolygon(game, poly));
        });

        if (childCluster.children.length) {
          childCluster.children.forEach(parseCluster);
        }
      });
    };

    this.hulls.clusters.forEach(parseCluster);

    this.calculateNeighbours();
  }

  /**
   * @method generateHulls
   * @description Create initial triangulation of "root" clusters of hulls
   * @param {Number[]} collisionIndices
   * @param {Phaser.TilemapLayer} tileLayer
   * @param {Phaser.Tilemap} tileMap
   */
  generateHulls(collisionIndices, tileLayer, tileMap) {
    const { game } = this;
    const { width, height, tileWidth, tileHeight } = tileMap;
    const parentEdges = [
      new Line(),
      new Line(width, 0),
      new Line(0, height),
      new Line(width, height)
    ];
    let edges = [];

    this.polygons = [];
    this.hulls = new Hulls(game, tileLayer, { collisionIndices });
    this.hulls.clusters.forEach(cluster => edges = edges.concat(cluster.edges));

    const { polygons } = new DelaunayCluster(edges, parentEdges, [], tileWidth, tileHeight, { interior: false });
    polygons.forEach(p => this.polygons.push(new NavMeshPolygon(game, p)));
  }
}