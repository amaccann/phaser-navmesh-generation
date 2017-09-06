function sortByLowest(a, b) {
  return b.priority - a.priority;
}

function sortByHighest(a, b) {
  return a.priority - b.priority;
}

export default class PriorityQueue {
  constructor(options = {}) {
    this.contents = [];

    this.sorted = false;
    this.sortStyle = options.low ? sortByLowest : sortByHighest;
  }

  /**
   * @method pop
   * @description Removes then returns the next element in the queue.
   */
  pop() {
    if (!this.sorted) {
      this.sort();
    }

    const element = this.contents.pop();

    return element ? element.object : null;
  }

  /**
   * @method top
   * @description Returns the next element in the queue
   */
  top() {
    if (!this.sorted) {
      this.sort();
    }

    const element = this.contents[this.contents.length - 1];

    return element ? element.object : null;
  }

  /**
   * @method includes
   * @description Checks if object is present in the queue
   * @return {Boolean}
   */
  includes(object) {
    return !!this.contents.find(o => o === object);
  }

  /**
   * @method empty
   */
  empty() {
    return this.contents.length === 0;
  }

  /**
   * @method push
   * @description Add a new object to the queue
   */
  push(object, priority, sort = false) {
    this.contents.push({ object, priority });
    this.sorted = false;

    if (sort) {
      this.sort();
    }
  }

  sort() {
    this.contents.sort(this.sortStyle);
    this.sorted = true;
  }

}
