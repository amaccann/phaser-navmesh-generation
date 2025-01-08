import Portal from './portal';
import { triarea2 } from '../utils';
import FunnelPoint from './funnelPoint';

export default class Funnel {

  /**
   * @constructor
   * @param {Number} midPointThreshold
   */
  constructor(midPointThreshold) {
    this.path = [];
    this.portals = [];
    this.midPointThreshold = midPointThreshold;
  }

  /**
   * @method add
   * @param {Phaser.Geom.Point} left
   * @param {Phaser.Geom.Point} right
   */
  add(left, right) {
    const { portals } = this;

    return portals.push(new Portal(left, right || left));
  }

  /**
   * @method addPointToPath
   * @param {Phaser.Geom.Point} portal
   * @param {Boolean} isNarrow
   */
  addPointToPath(portal, isNarrow = false) {
    const { path } = this;
    const exists = path.find(p => p.equals(portal));
    if (!exists) {
      path.push(new FunnelPoint(portal.x, portal.y, isNarrow));
    }
  }

  /**
   * @method update
   * @description JS variant of http://digestingduck.blogspot.com/2010/03/simple-stupid-funnel-algorithm.html
   * @TODO Should check if there are any gaps, edges missing points, maybe we could fill with mid-point fallbacks...
   */
  update() {
    const { path, portals, midPointThreshold } = this;
    const portalsLength = portals.length;

    let apexIndex = 0;
    let leftIndex = 0;
    let rightIndex = 0;

    let apex = portals[0].left;
    let portalLeft = portals[0].left;
    let portalRight = portals[0].right;
    let i = 1;
    let left;
    let right;

    this.addPointToPath(apex);

    // Reset values and make current apex as ${portal}
    /**
     * @function setApexAndReset
     * @param {Phaser.Geom.Point} point
     * @param {Boolean} isNarrow
     * @param {Number} index
     */
    const setApexAndReset = (point, index, isNarrow = false) => {
      this.addPointToPath(point, isNarrow);
      apex = point;
      apexIndex = index;

      portalLeft = apex;
      portalRight = apex;
      leftIndex = apexIndex;
      rightIndex = apexIndex;
      i = apexIndex;
    };

    for (i; i < portalsLength; i++) {
      left = portals[i].left;
      right = portals[i].right;
      if (portals[i].isTooNarrow(midPointThreshold)) {
        setApexAndReset(portals[i].midPoint, i, true);
        continue;
      }

      // Update right vertex.
      if (triarea2(apex, portalRight, right) <= 0.0) {
        if (apex.equals(portalRight) || triarea2(apex, portalLeft, right) > 0.0) {
          portalRight = right; // Tighten the funnel
          rightIndex = i;
        } else { // Vertices crossed over, left so now be part of path
          setApexAndReset(portalLeft, leftIndex);
          continue;
        }
      }

      if (triarea2(apex, portalLeft, left) >= 0.0) {
        if (apex.equals(portalLeft) || triarea2(apex, portalRight, left) < 0.0) {
          portalLeft = left; // Tighten the funnel.
          leftIndex = i;
        } else { // left crossed right, so right vertex now part of the path
          setApexAndReset(portalRight, rightIndex);
          continue;
        }
      }
    }

    if (!path.length || (!path[path.length - 1].equals(portals[portalsLength - 1].left))) {
      this.addPointToPath(portals[portals.length - 1].left);
    }
  }
}
