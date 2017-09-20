import Hulls from './hulls';
import NavMeshPolygon from '../navMeshPolygon';
import { areLinesEqual, sortLine } from '../utils';
import DelaunayCluster from './delaunayCluster';

/**
 * @class DelaunayGenerator
 * @description Helper class to generate the delaunay triangles used in building the NavMesh
 */
export default class DelaunayGenerator {
  constructor(tileMap, tileLayer) {
    this.points = [];
    this.polygons = [];
    this.tileMap = tileMap;
    this.tileLayer = tileLayer;
  }

  /**
   * @method generatePolygonEdges
   * @description Find all neighbours for each Polygon generated; we assume all are potentially connected given Delaunay
   * @param {NavMeshPolygon[]} polygons
   *
   */
  calculateClusterNeighbours(polygons = []) {
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
  generate(collisionIndices) {
    const { tileLayer, tileMap } = this;
    const { tileWidth, tileHeight } = tileMap;
    const options = { exterior: false };

    this.generateHulls(collisionIndices, tileLayer, tileMap);

    /**
     * @function parseCluster
     * @param {Cluster} cluster
     */
    const parseCluster = cluster => {
      const clusterPolygons = [];

      cluster.children.forEach(child => {
        const parentEdges = cluster.edges;
        const { edges } = child;
        const { polygons } = new DelaunayCluster(edges, parentEdges, child.allChildEdges, tileWidth, tileHeight, options);

        polygons.forEach(poly => clusterPolygons.push(new NavMeshPolygon(poly)));

        if (child.children.length) {
          child.children.forEach(parseCluster);
        }
      });

      this.polygons = this.polygons.concat(clusterPolygons);
      this.calculateClusterNeighbours(clusterPolygons);
    };

    this.hulls.clusters.forEach(parseCluster);
  }

  /**
   * @method generateHulls
   * @description Create initial triangulation of "root" clusters of hulls
   * @param {Number[]} collisionIndices
   * @param {Phaser.TilemapLayer} tileLayer
   * @param {Phaser.Tilemap} tileMap
   */
  generateHulls(collisionIndices, tileLayer, tileMap) {
    const { width, height, tileWidth, tileHeight } = tileMap;
    const parentEdges = [
      new Phaser.Line(),
      new Phaser.Line(width, 0),
      new Phaser.Line(0, height),
      new Phaser.Line(width, height)
    ];
    let edges = [];

    this.polygons = [];
    this.hulls = new Hulls(tileLayer, { collisionIndices });
    this.hulls.clusters.forEach(cluster => edges = edges.concat(cluster.edges));

    const { polygons } = new DelaunayCluster(edges, parentEdges, [], tileWidth, tileHeight, { interior: false });
    polygons.forEach(p => this.polygons.push(new NavMeshPolygon(p)));
    this.calculateClusterNeighbours(this.polygons);
  }
}