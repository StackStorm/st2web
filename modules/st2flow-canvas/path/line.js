// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

import Vector from '../vector';
import { ORBIT_DISTANCE } from '../const';

export type Direction = 'up' | 'down' | 'left' | 'right';
export class Line {
  px: number;
  direction: Direction;
  constructor(px: number, dir: Direction) {
    Object.defineProperties(this, {
      direction: {
        value: dir,
      },
      px: {
        value: px,
      },
    });
  }
  calcNewPosition(origin: Vector): Vector {
    const point = new Vector(origin.x, origin.y);
    switch(this.direction) {
      case 'up':
        point.y -= this.px;
        break;
      case 'down':
        point.y += this.px;
        break;
      case 'left':
        point.x -= this.px;
        break;
      case 'right':
        point.x += this.px;
        break;
    }
    return point;
  }
  toPathString(origin: Vector, next: Line): string {
    const newPoint = this.calcNewPosition(origin);

    // does the next line segment curve out?
    const adjustmentNext = next && next.direction !== this.direction ? ORBIT_DISTANCE : 0;
    // does this line go up and down?  or left and right?
    const isYDimension = this.direction === 'up' || this.direction === 'down';
    // Which direction in pixels from 0,0?
    const dimensionScale = this.direction === 'up' || this.direction === 'left' ? -1 : 1;

    let curvePath = '';

    if(adjustmentNext) {
      const adjustmentMax = Math.min(adjustmentNext, next.px / 2, this.px / 2);
      const nextIsYDimension = next.direction === 'up' || next.direction === 'down';
      const nextDimensionScale = next.direction === 'up' || next.direction === 'left' ? -1 : 1;

      if(isYDimension && !nextIsYDimension) {
        const oldPointY = newPoint.y;
        newPoint.y -= adjustmentMax * dimensionScale;
        const controlPointX = newPoint.x + adjustmentMax * nextDimensionScale;
        curvePath = ` Q ${newPoint.x} ${oldPointY}, ${controlPointX} ${oldPointY}`;
      }
      else if(nextIsYDimension) {
        const oldPointX = newPoint.x;
        const controlPointY = newPoint.y + adjustmentMax * nextDimensionScale;
        newPoint.x -= adjustmentMax * dimensionScale;
        curvePath = ` Q ${oldPointX} ${newPoint.y}, ${oldPointX} ${controlPointY}`;
      }
    }

    return `L ${newPoint.x} ${newPoint.y}${curvePath}`;
  }
  toString(): string {
    return `${this.px} ${this.direction}`;
  }
}

export default Line;
