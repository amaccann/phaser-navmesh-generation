import { Line } from 'phaser-ce';
import { triarea2 } from './utils';

export default class Cluster extends Phaser.Polygon {
  constructor(contours, edges) {
    super(contours);
    this.edges = edges;
    this.optimiseEdges();
  }

  /**
   * @method optimiseEdges
   * @description Iterate across lines:
   * 1. Check the triarea created by ${i} and the next one along.
   * 2. If zero, then they are lines along the same axis
   * 3. Create a new Line() merge of the two, splice into the array.
   * 3. Restart the iteration from the previous index.
   */
  optimiseEdges() {
    const { edges } = this;
    let i = 0;
    let line;

    for (i; i < edges.length; i++) {
      const line1 = edges[i];
      const line2 = edges[i + 1];
      if (!line2) {
        continue;
      }

      const area = triarea2(line1.start, line1.end, line2.end);
      line = new Line(line1.start.x, line1.start.y, line2.end.x, line2.end.y);
      if (!area) {
        edges.splice(i, 2, line);
        i--; // start again
      }
    }
  }
}
