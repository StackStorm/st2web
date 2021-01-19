// Copyright 2021 The StackStorm Authors.
// Copyright 2020 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


export interface Sampler {
  getNext(taskName: string, transitionsTo: Array<string>): {| x: number, y: number |};
  prefillPoint(x: number, y: number, transitionsTo: Array<string>): {| x: number, y: number |};
}

export class PoissonRectangleSampler implements Sampler {
  k = 30; // maximum number of samples before rejection
  width: number;
  height: number;
  radiusX: number;
  radiusY: number;
  gridWidth: number;
  gridHeight: number;
  grid: Array<{ x: number, y: number, transitionsTo: Array<string>}>;
  queue: Array<{ x: number, y: number, transitionsTo: Array<string> }> = [];
  queueSize = 0;
  sampleSize = 0;
  prandSeed: number;
  snapDistance: number;

  constructor(width: number, height: number, radiusX: number, radiusY: number, snapDistance: number = 20) {
    Object.assign(this, { width, height, radiusX, radiusY, snapDistance});
    this.gridWidth = Math.ceil(width / radiusX);
    this.gridHeight = Math.ceil(height / radiusY);
    this.grid = new Array(this.gridWidth * this.gridHeight);
  }

  getNext(taskName: string, transitionsTo: Array<string>): {| x: number, y:number |} {
    this.prandSeed = parseInt(taskName.replace(/[^A-Z0-9]/ig, ''), 36) % 2147483647;
    if (!this.sampleSize) {
      // for placing the first item, put it near the upper left.
      return this.sample(this.prand() * this.radiusX, this.prand() * this.radiusY, transitionsTo);
    }

    // Pick a random existing sample and remove it from the queue.
    // Favor any task that's connected to the one we're trying to place via a transition
    while (this.queueSize) {
      const connectedTasks = this.queue.filter(s => s.transitionsTo.includes(taskName));
      const i = connectedTasks.length
        ? this.queue.indexOf(connectedTasks[Math.floor(this.prand() * connectedTasks.length)])
        : Math.floor(this.prand() * this.queueSize);
      const s = this.queue[i];

      // Make a new candidate between [radius, 2 * radius] from the existing sample.
      for (let j = 0; j < this.k; ++j) { // eslint-disable-line no-plusplus
        // If there is a transition from the selected task to the new on, throw out most of the pseudo-random
        //   placement and place preferentially directly below.
        if(s.transitionsTo.includes(taskName)) {
          for(let adjustmentY of [ 1, 2 ]) {
            for(let adjustmentX of [ -1, 0, -2, 1 ]) {
              adjustmentX *= this.radiusX;
              adjustmentY = this.radiusY; // y adjustment is fixed at +1 no matter which x is chosen
              const x = s.x + Math.round((adjustmentX + this.prand() * this.radiusX) / this.snapDistance) * this.snapDistance;
              const y = s.y + Math.round((adjustmentY + this.prand() * this.radiusY) / this.snapDistance) * this.snapDistance;
              if (0 <= x && x < this.width && 0 <= y && y < this.height && this.far(x, y)) {
                return this.sample(x, y, transitionsTo);
              }
            }
          }
        }
        // otherwise place up to 1 height/width away in any orthogonal or diagonal dir.
        else {
          //since we're looking in a rectangle, we'll first pick one of the 12 cells around the
          //  2w * 2h rectangle which are of size (w, h)
          const cell = Math.floor(this.prand() * 12);
          const adjustmentX = [ -2, -1, 0, 1, -2, 1, -2, 1, -2, -1, 0, 1 ][cell] * this.radiusX;
          const adjustmentY = [ -2, -2, -2, -2, -1, -1, 0, 0, 1, 1, 1, 1 ][cell] * this.radiusY;
          const x = s.x + Math.round((adjustmentX + this.prand() * this.radiusX) / this.snapDistance) * this.snapDistance;
          const y = s.y + Math.round((adjustmentY + this.prand() * this.radiusY) / this.snapDistance) * this.snapDistance;

          // Reject candidates that are outside the allowed extent,
          // or closer than 2 * radius to any existing sample.
          if (0 <= x && x < this.width && 0 <= y && y < this.height && this.far(x, y)) {
            return this.sample(x, y, transitionsTo);
          }
        }
      }

      this.queue[i] = this.queue[--this.queueSize]; // eslint-disable-line no-plusplus
      this.queue.length = this.queueSize;
    }
    return { x: 0, y: 0 };
  }

  prand() {
    this.prandSeed = this.prandSeed * 16807 % 2147483647;
    return (this.prandSeed - 1) / 2147483646;
  }

  far(x, y) {
    let i = Math.floor(x / this.radiusX);
    let j = Math.floor(y / this.radiusY);
    const i0 = Math.max(i - 2, 0);
    const j0 = Math.max(j - 2, 0);
    const i1 = Math.min(i + 3, this.gridWidth);
    const j1 = Math.min(j + 3, this.gridHeight);

    for (j = j0; j < j1; ++j) { // eslint-disable-line no-plusplus
      const o = j * this.gridWidth;
      for (i = i0; i < i1; ++i) {  // eslint-disable-line no-plusplus
        const s = this.grid[o + i];
        if (s) {
          const dx = Math.abs(s.x - x);
          const dy = Math.abs(s.y - y);
          if (dx < this.radiusX && dy < this.radiusY) {
            return false;
          }
        }
      }
    }

    return true;
  }

  sample(x: number, y: number, transitionsTo: Array<string>): {| x: number, y: number |} {
    const s = { x, y };
    const t = { x, y, transitionsTo };
    this.queue.push(t);
    this.grid[this.gridWidth * Math.floor(y / this.radiusY) + Math.floor(x / this.radiusX)] = t;
    ++this.sampleSize;  // eslint-disable-line no-plusplus
    ++this.queueSize;  // eslint-disable-line no-plusplus
    return s;
  }

  prefillPoint(x: number, y: number, transitionsTo: Array<string>): {| x: number, y: number |} {
    if(x > this.width || y > this.height) {
      // resize the grid to handle the larger size.
      const oldGrid = this.grid;
      this.width = x + 2 * this.radiusX;
      this.height = y + 2 * this.radiusY;
      this.gridWidth = Math.ceil(this.width / this.radiusX);
      this.gridHeight = Math.ceil(this.height / this.radiusY);
      this.grid = new Array(this.gridWidth * this.gridHeight);
      this.sampleSize = 0;
      this.queueSize = 0;
      oldGrid.forEach(cell => {
        if(cell) {
          this.sample(cell.x, cell.y, cell.transitionsTo);
        }
      });
    }
    return this.sample(x, y, transitionsTo);
  }
}

export default PoissonRectangleSampler;
