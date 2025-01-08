/**
 * @class EdgePoint
 * @extends Phaser.Geom.Point
 */
export default class EdgePoint extends Phaser.Math.Vector2 {
  constructor(point) {
    console.log('point', point);
    super(point.x, point.y);
    this.sources = [point];
  }

  /**
   * @method addSource
   * @description Add a reference to a matching {Phaser.Geom.Point} object
   * @param {Phaser.Geom.Point} point
   */
  addSource(point) {
    this.sources.push(point);
  }

  /**
   * @method updateSources
   * @description Update all the source {Phaser.Geom.Point] instances that were originally matched to this.
   */
  updateSources() {
    const { sources, x, y } = this;
    sources.forEach(point => point.setTo(x, y));
  }
}