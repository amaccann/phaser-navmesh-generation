/**
 * @class EdgePoint
 * @extends Phaser.Point
 */
export default class EdgePoint extends Phaser.Point {
  constructor(point) {
    super(point.x, point.y);
    this.sources = [point];
  }

  /**
   * @method addSource
   * @description Add a reference to a matching {Phaser.Point} object
   * @param {Phaser.Point} point
   */
  addSource(point) {
    this.sources.push(point);
  }

  /**
   * @method updateSources
   * @description Update all the source {Phaser.Point] instances that were originally matched to this.
   */
  updateSources() {
    const { sources, x, y } = this;
    sources.forEach(point => point.setTo(x, y));
  }
}