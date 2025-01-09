export default class Portal {
  /**
   * @constructor
   * @param {Phaser.Geom.Point} left
   * @param {Phaser.Geom.Point} right
   */
  constructor(left, right) {
    this.left = left;
    this.right = right;
    this.midPoint = Phaser.Geom.Point.GetCentroid([ left, right ]);
    this.length = Phaser.Geom.Line.Length(left, right);
  }

  /**
   * @method isTooNarrow
   * @description If this portal is considered too 'narrow' to conduct funneling, we'll simply use the midpoint instead
   * @param {Number} threshold
   * @return {Boolean}
   */
  isTooNarrow(threshold) {
    return this.length && this.length < threshold;
  }
}
