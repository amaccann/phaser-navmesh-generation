export default class FunnelPoint extends Phaser.Point {
  constructor(x, y, isNarrow = false) {
    super(x, y);
    this.isNarrow = isNarrow;
  }
}