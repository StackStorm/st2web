// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

//@flow

// Copyright (C) 2011 by Evan Wallace
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Provides a simple 3D vector class. Vector operations can be done using member
// functions, which return new vectors, or static functions, which reuse
// existing vectors to avoid generating garbage.
export default class Vector {
  x: number
  y: number
  z: number

  constructor(px: any, py?: number, pz?: number) {
    const { x = px, y = py, z = pz } = px;

    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  }

  transform(fn: Function, v?: Vector | number) {
    if (v instanceof Vector) {
      return new Vector(fn(this.x, v.x), fn(this.y, v.y), fn(this.z, v.z));
    }
    return new Vector(fn(this.x, v), fn(this.y, v), fn(this.z, v));
  }

  // ### Instance Methods
  // The methods `add()`, `subtract()`, `multiply()`, and `divide()` can all
  // take either a vector or a number as an argument.
  negative() {
    return this.transform(i => -i);
  }

  add(v: Vector | number) {
    return this.transform((i, v) => i + v, v);
  }

  subtract(v: Vector | number) {
    return this.transform((i, v) => i - v, v);
  }

  multiply(v: Vector | number) {
    return this.transform((i, v) => i * v, v);
  }

  divide(v: Vector | number) {
    return this.transform((i, v) => i / v, v);
  }

  equals(v: Vector) {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }

  dot(v: Vector) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector) {
    return new Vector(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  length() {
    return Math.sqrt(this.dot(this));
  }

  unit() {
    return this.divide(this.length());
  }

  min() {
    return Math.min(Math.min(this.x, this.y), this.z);
  }

  max() {
    return Math.max(Math.max(this.x, this.y), this.z);
  }

  toAngles() {
    return {
      theta: Math.atan2(this.z, this.x),
      phi: Math.asin(this.y / this.length()),
    };
  }

  angleTo(a: Vector) {
    return Math.acos(this.dot(a) / (this.length() * a.length()));
  }

  toArray(n: number): Array<number> {
    return [ this.x, this.y, this.z ].slice(0, n || 3);
  }

  clone() {
    return new Vector(this.x, this.y, this.z);
  }

  init(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  // ### Static Methods
  // `Vector.randomDirection()` returns a vector with a length of 1 and a
  // statistically uniform direction. `Vector.lerp()` performs linear
  // interpolation between two vectors.
  static negative(a: Vector, b: Vector) {
    b.x = -a.x; b.y = -a.y; b.z = -a.z;
    return b;
  }

  static add(a: Vector, b: Vector | number, c: Object = {}) {
    if (b instanceof Vector) {
      c.x = a.x + b.x;
      c.y = a.y + b.y;
      c.z = a.z + b.z;
    }
    else {
      c.x = a.x + b;
      c.y = a.y + b;
      c.z = a.z + b;
    }
    return c;
  }

  static subtract(a: Vector, b: Vector | number, c: Object = {}) {
    if (b instanceof Vector) {
      c.x = a.x - b.x;
      c.y = a.y - b.y;
      c.z = a.z - b.z;
    }
    else {
      c.x = a.x - b;
      c.y = a.y - b;
      c.z = a.z - b;
    }
    return c;
  }

  static multiply(a: Vector, b: Vector | number, c: Object = {}) {
    if (b instanceof Vector) {
      c.x = a.x * b.x;
      c.y = a.y * b.y;
      c.z = a.z * b.z;
    }
    else {
      c.x = a.x * b;
      c.y = a.y * b;
      c.z = a.z * b;
    }
    return c;
  }

  static divide(a: Vector, b: Vector | number, c: Object = {}) {
    if (b instanceof Vector) {
      c.x = a.x / b.x;
      c.y = a.y / b.y;
      c.z = a.z / b.z;
    }
    else {
      c.x = a.x / b;
      c.y = a.y / b;
      c.z = a.z / b;
    }
    return c;
  }

  static cross(a: Vector, b: Vector, c: Object = {}) {
    c.x = a.y * b.z - a.z * b.y;
    c.y = a.z * b.x - a.x * b.z;
    c.z = a.x * b.y - a.y * b.x;
    return c;
  }

  static unit(a: Vector, b: Object = {}) {
    const length = a.length();
    b.x = a.x / length;
    b.y = a.y / length;
    b.z = a.z / length;
    return b;
  }

  static fromAngles(theta: number, phi: number) {
    return new Vector(Math.cos(theta) * Math.cos(phi), Math.sin(phi), Math.sin(theta) * Math.cos(phi));
  }

  static randomDirection() {
    return Vector.fromAngles(Math.random() * Math.PI * 2, Math.asin(Math.random() * 2 - 1));
  }

  static min(a: Vector, b: Vector) {
    return new Vector(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
  }

  static max(a: Vector, b: Vector) {
    return new Vector(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
  }

  static lerp(a: Vector, b: Vector, fraction: number) {
    return b.subtract(a).multiply(fraction).add(a);
  }

  static fromArray(a: Array<number>) {
    return new Vector(a[0], a[1], a[2]);
  }

  static angleBetween(a: Vector, b: Vector) {
    return a.angleTo(b);
  }
}
