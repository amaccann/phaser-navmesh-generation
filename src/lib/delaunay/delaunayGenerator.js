import Hulls from './hulls';
import NavMeshPolygon from '../navMeshPolygon';
import {areLinesEqual, offsetEdges, sortLine} from '../utils';
import DelaunayCluster from './delaunayCluster';
import Config from '../config';

/**
 * @class DelaunayGenerator
 * @description Helper class to generate the delaunay triangles used in building the NavMesh
 */
export default class DelaunayGenerator {
  constructor() {
    this.points = [];
    this.polygons = [];
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

            const sortedLine = sortLine(edge);
            const start = sortedLine.getPointA();
            const end = sortedLine.getPointB();

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
  generate() {
    const options = { exterior: false };

    if (this.hulls) {
      this.hulls.generate();
    } else {
      this.hulls = new Hulls();
    }

    this.parseHullClusters();

    /**
     * @method getOffsetChildEdges
     * @param {Cluster} cluster
     * @return {Phaser.Line[]}
     */
    const getOffsetChildEdges = cluster => {
      const { children } = cluster;
      let edges = [];

      children.forEach(child =>  edges = edges.concat(offsetEdges(child.edges, false, cluster.children)));
      return edges;
    };

    /**
     * @function parseCluster
     * @param {Cluster} cluster
     */
    const parseCluster = cluster => {
      const clusterPolygons = [];

      cluster.children.forEach(child => {
        const parentEdges = cluster.edges;
        const edges = offsetEdges(child.edges, true, child.children);
        const allChildEdges = getOffsetChildEdges(child);
        const { polygons } = new DelaunayCluster(edges, parentEdges, allChildEdges, options);

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
   * @method parseHullClusters
   * @description Create initial triangulation of "root" clusters of hulls
   */
  parseHullClusters() {
    const { hulls } = this;
    const { width, height } = Config.mapDimensions;
    const parentEdges = [
      new Phaser.Geom.Line(0, 0, width, 0),
      new Phaser.Geom.Line(width, 0, width, height),
      new Phaser.Geom.Line(width, height, 0, height),
      new Phaser.Geom.Line(0, height, 0, 0)
    ];
    let edges = [];

    this.polygons = [];
    hulls.clusters.forEach(cluster => edges = edges.concat(offsetEdges(cluster.edges, false, hulls.clusters)));

    const { polygons } = new DelaunayCluster(edges, parentEdges, [], { interior: false });
    polygons.forEach(p => this.polygons.push(new NavMeshPolygon(p)));
    this.calculateClusterNeighbours(this.polygons);
  }
}