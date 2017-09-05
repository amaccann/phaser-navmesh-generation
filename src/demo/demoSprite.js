import Physics, { Sprite } from 'phaser-ce';

const SPEED = 150;
const ANCHOR = 0.5;
const NINETY_DEGREES_IN_RADIANS = 1.5708;
const DEFAULT_PATH = {
  offsetPath: [],
  path: []
};

export default class DemoSprite extends Sprite {
  /**
   * @constructor
   * @param {Phaser.Game} game
   * @param {Number} x
   * @param {Number} y
   * @param {Phaser.Group} group
   */
  constructor(game, x, y, group) {
    super(game, x, y, 'agent');
    this.path = DEFAULT_PATH;
    this.anchor.setTo(ANCHOR, ANCHOR);
    game.physics.enable(this, Physics.ARCADE);
    game.world.bringToTop(this);
    group.add(this);
  }

  /**
   * @method addPath
   */
  addPath(path = DEFAULT_PATH) {
    this.path = path;
  }

  /**
   * @method update
   */
  update() {
    const { game, path, position } = this;
    const { arcade } = game.physics;
    const offsetPath = path.offsetPath || [];

    if (!offsetPath.length) {
      return this.body.stop();
    }

    const [ current ] = offsetPath;
    if (position.distance(current) < 5) {
      path.offsetPath = offsetPath.slice(1);
      return;
    }

    this.rotation = arcade.angleBetween(position, current) + NINETY_DEGREES_IN_RADIANS;
    arcade.moveToXY(this, current.x, current.y, SPEED);
  }
}