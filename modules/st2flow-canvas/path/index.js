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

import Vector from '../vector';
import type { Direction } from './line';
import Line from './line';

export class Path {
  origin: Vector
  elements: Array<Line> = [];
  initialDir: Direction
  constructor(origin: Vector, dir: Direction) {
    Object.assign(this, { origin, initialDir: dir });
  }

  moveTo(newPosition: Vector) {
    const pos = this.currentPosition;
    const dir = this.currentDir;

    const yMove = newPosition.y !== pos.y;
    const xMove = newPosition.x !== pos.x;

    let xLine: Line;
    let yLine: Line;
    if(xMove) {
      if(this.elements.length && (dir === 'left' || dir === 'right')) {
        xLine = this.elements.pop();
        xLine = new Line(xLine.px + (newPosition.x - pos.x) * (dir === 'left' ? -1 : 1), xLine.direction);
      }
      else {
        xLine = new Line(
          Math.abs(newPosition.x - pos.x),
          newPosition.x > pos.x ? 'right' : 'left'
        );
      }
    }
    if(yMove) {
      if(this.elements.length && (dir === 'up' || dir === 'down')) {
        yLine = this.elements.pop();
        yLine = new Line(yLine.px + (newPosition.y - pos.y) * (dir === 'up' ? -1 : 1), yLine.direction);
      }
      else {
        yLine = new Line(
          Math.abs(newPosition.y - pos.y),
          newPosition.y > pos.y ? 'down' : 'up'
        );
      }
    }
    if(dir === 'left' || dir === 'right') {
      xLine && this.addLine(xLine);
      yLine && this.addLine(yLine);
    }
    else {
      yLine && this.addLine(yLine);
      xLine && this.addLine(xLine);
    }
  }

  addLine(line: Line) {
    this.elements.push(line);
  }

  get currentDir() {
    return this.elements.length > 0
      ? this.elements[this.elements.length - 1].direction
      : this.initialDir;
  }

  get currentPosition() {
    let currentPoint = this.origin;
    this.elements.forEach(el => {
      currentPoint = el.calcNewPosition(currentPoint);
    });
    return currentPoint;
  }

  toString(): string {
    let origin: Vector = this.origin;
    const path = this.elements.map((el, idx) => {
      const next = this.elements[idx + 1];
      const str = el.toPathString(origin, next);
      origin = el.calcNewPosition(origin);

      return str;
    }).join(' ');
    return `M ${this.origin.x} ${this.origin.y} ${path}`;
  }
}

export default Path;
