const SPEED = 125;

const NINETY_DEGREES_IN_RADIANS = 1.5708;
const DEFAULT_PATH = {
  offsetPath: [],
  path: []
};

export default class DemoSprite extends Phaser.GameObjects.Sprite {
  /**
   * @constructor
   * @param {Phaser.Game} game
   * @param {Number} x
   * @param {Number} y
   * @param {Phaser.Group} group
   */
  constructor(scene, x, y, group) {
    super(scene, x, y, 'agent');
    scene.add.existing(this);
    this.path = DEFAULT_PATH;
    // this.anchor.setTo(ANCHOR, ANCHOR);
    scene.physics.add.existing(this, 0);
    
    scene.children.bringToTop(this);
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
    const { path, scene } = this;
    const offsetPath = path.offsetPath || [];

    if (!offsetPath.length) {
      return this.body.stop();
    }

    const [ current ] = offsetPath;
    if (Phaser.Math.Distance.BetweenPoints(this, current) < 5) {
      path.offsetPath = offsetPath.slice(1);
      return;
    }

    this.rotation = Phaser.Math.Angle.BetweenPoints(this, current) + NINETY_DEGREES_IN_RADIANS// arcade.angleBetween(position, current) + NINETY_DEGREES_IN_RADIANS;
    scene.physics.moveToObject(this, current, SPEED);

    scene.physics.collide(this, scene.tileLayer);
  }
}