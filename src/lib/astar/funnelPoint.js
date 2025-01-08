export default class FunnelPoint extends Phaser.Geom.Point {
  constructor(x, y, isNarrow = false) {
    super(x, y);
    this.isNarrow = isNarrow;
  }
}