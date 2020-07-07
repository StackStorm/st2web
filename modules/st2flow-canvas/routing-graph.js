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

// @flow
import { Graph } from './astar';
import { ORBIT_DISTANCE } from './const';

export type BoundingBox = {|
  left: number,
  right: number,
  top: number,
  bottom: number,
  midpointX: number,
  midpointY: number,
|};

export function makeRoutingGraph(boundingBoxes: Array<BoundingBox>): Graph {
  if (boundingBoxes.length < 1) {
    return new Graph([], {});
  }

  /*  Let I be the set of interesting points (x, y) in the diagram, i.e. the connector
  points and corners of the bounding box of each object. Let XI be the set of x
  coordinates in I and YI the set of y coordinates in I. The orthogonal visibility
  graph V G = (V, E) is made up of nodes V ⊆ XI × YI s.t. (x, y) ∈ V iff there
  exists y0 s.t. (x, y0) ∈ I and there is no intervening object between (x, y) and
  (x, y0) and there exists x0 s.t. (x0, y) ∈ I and there is no intervening object
  between (x, y) and (x0, y). There is an edge e ∈ E between each point in V to its
  nearest neighbour to the north, south, east and west iff there is no intervening
  object in the original diagram */
  const border = {
    left: Infinity,
    right: -Infinity,
    top: Infinity,
    bottom: -Infinity,
  };
  const I = [].concat(...boundingBoxes.map(box => {
    if(box.left < border.left) {
      border.left = box.left;
    }
    if(box.right > border.right) {
      border.right = box.right;
    }
    if(box.top < border.top) {
      border.top = box.top;
    }
    if(box.bottom > border.bottom) {
      border.bottom = box.bottom;
    }

    return [
      { x: box.left, y: box.top },
      { x: box.left, y: box.bottom },
      { x: box.right, y: box.top },
      { x: box.right, y: box.bottom },
      // our connectors are currently at the midpoints of each edge.
      //  That can be changed here.
      { x: box.left, y: box.midpointY },
      { x: box.midpointX, y: box.top },
      { x: box.midpointX, y: box.bottom },
      { x: box.right, y: box.midpointY },
    ];
  })).concat([
    { x: border.left - ORBIT_DISTANCE, y: border.top - ORBIT_DISTANCE },
    { x: border.left - ORBIT_DISTANCE, y: border.bottom + ORBIT_DISTANCE },
    { x: border.right + ORBIT_DISTANCE, y: border.top - ORBIT_DISTANCE },
    { x: border.right + ORBIT_DISTANCE, y: border.bottom + ORBIT_DISTANCE },
  ]);
  const XI = I.reduce((a, i) => {
    a[i.x] = a[i.x] || [];
    a[i.x].push(i.y);
    return a;
  }, {});
  const YI = I.reduce((a, i) => {
    a[i.y] = a[i.y] || [];
    a[i.y].push(i.x);
    return a;
  }, {});
  const E = {};
  const V = [].concat(...Object.keys(XI).map(interestingX => {
    const x = +interestingX;
    return Object.keys(YI).map(interestingY => {
      const y = +interestingY;
      // optimization: find nearest neighbor first.
      //  if nearest neighbors are blocked then all are.
      let nearestNeighborUp = -Infinity;
      let nearestNeighborDown = Infinity;
      let nearestNeighborLeft = -Infinity;
      let nearestNeighborRight = Infinity;
      YI[y].forEach(_x => {
        // x > _x means _x is to the left
        if(x !== _x) {
          if(x > _x && _x > nearestNeighborLeft) {
            nearestNeighborLeft = _x;
          }
          if(x < _x && _x < nearestNeighborRight) {
            nearestNeighborRight = _x;
          }
        }
      });
      XI[x].forEach(_y => {
        // y > _y means _y is above
        if(y !== _y) {
          if(y > _y && _y > nearestNeighborUp) {
            nearestNeighborUp = _y;
          }
          if(y < _y && _y < nearestNeighborDown) {
            nearestNeighborDown = _y;
          }
        }
      });

      boundingBoxes.forEach(box => {
        // Make visibility checks.  If a box is beween (x, y) and the nearest "interesting" neighbor,
        // (interesting neighbors are the points in I which share either an X or Y coordinate)
        // remove that nearest neighbor.
        if (x > box.left && x < box.right && y === box.bottom) {
          // in this case y is the interesting point. Mark it as not having nearest neighbor
          nearestNeighborUp = NaN;
        }
        else if(nearestNeighborUp > -Infinity && x > box.left && x < box.right && y > box.top && nearestNeighborUp < box.bottom) {
          nearestNeighborUp = -Infinity;
        }
        if (x > box.left && x < box.right && y === box.top) {
          // in this case y is the interesting point. Mark it as not having nearest neighbor
          nearestNeighborDown = NaN;
        }
        else if(nearestNeighborDown < Infinity && x > box.left && x < box.right && y < box.bottom && nearestNeighborDown > box.top) {
          nearestNeighborDown = Infinity;
        }
        if (y > box.top && y < box.bottom && x === box.right) {
          // in this case y is the interesting point. Mark it as not having nearest neighbor
          nearestNeighborLeft = NaN;
        }
        else if(nearestNeighborLeft > -Infinity && y > box.top && y < box.bottom && x > box.left && nearestNeighborLeft < box.right) {
          nearestNeighborLeft = -Infinity;
        }
        if (y > box.top && y < box.bottom && x === box.left) {
          // in this case y is the interesting point. Mark it as not having nearest neighbor
          nearestNeighborRight = NaN;
        }
        else if(nearestNeighborRight < Infinity && y > box.top && y < box.bottom && x < box.right && nearestNeighborRight > box.left) {
          nearestNeighborRight = Infinity;
        }
      });

      if (XI[x].indexOf(y) > -1 ||
        ((nearestNeighborUp > -Infinity ||
          nearestNeighborDown < Infinity) &&
        (nearestNeighborLeft > -Infinity ||
          nearestNeighborRight < Infinity))
      ) {
        E[`${x}|${y}`] = E[`${x}|${y}`] || [];
        return {
          x,
          y,
          nearestNeighborUp,
          nearestNeighborDown,
          nearestNeighborRight,
          nearestNeighborLeft,
        };
      }
      else {
        return {x, y: -Infinity, nearestNeighborLeft, nearestNeighborRight, nearestNeighborDown, nearestNeighborUp};
      }
    }).filter(({y}) => y > -Infinity && `${x}|${y}` in E);
  }));

  V.forEach(v => {
    const {
      x,
      y,
    } = v;
    let {
      nearestNeighborUp,
      nearestNeighborDown,
      nearestNeighborLeft,
      nearestNeighborRight,
    } = v;
    // for what to put in the graph edges, now we want to look
    // at any point in V, not just interesting ones.
    // If there exists a point of interest (x, yi) such that there
    // is no bounding box intervening, then all points
    // (x, yj), y < yj < yi or y > yj > yi, will also not have a bounding
    // box intervening, so we don't have to check again.  Above, a bounding
    // box being to the immediate left/top/right/bottom of a point caused
    // that nearest neighbot to be set to NaN.
    if((nearestNeighborUp = Object.keys(YI).reduce((bestY, _yStr) => {
      const _y = +_yStr;
      // 1. ensure nearest neighbor is a point in V (`x|y` in E means that a set of edges was set up for a point,
      //      and that's easier than iterating through V and doing deep comparisons)
      // 2. Make sure it's not the same point and actually upward (_y < y) (NaN fails here, as NaN fails all < and > comparisons)
      // 3. Check if it's closer than the previous candidate (_y > bestY)
      // 4. if all are true, choose it instead of the previous candidate.
      // 4a. if any are false, use the previous candidate instead.
      return `${x}|${_y}` in E && _y < y && _y > bestY ? _y : bestY;
    }, nearestNeighborUp)) !== -Infinity && nearestNeighborUp === nearestNeighborUp) {
      E[`${x}|${y}`].push({x, y: nearestNeighborUp});
    }
    if((nearestNeighborDown = Object.keys(YI).reduce((bestY, _yStr) => {
      const _y = +_yStr;
      return `${x}|${_y}` in E && _y > y && _y < bestY ? _y : bestY;
    }, nearestNeighborDown)) !== Infinity && nearestNeighborDown === nearestNeighborDown) {
      E[`${x}|${y}`].push({x, y: nearestNeighborDown});
    }
    if((nearestNeighborLeft = Object.keys(XI).reduce((bestX, _xStr) => {
      const _x = +_xStr;
      return `${_x}|${y}` in E && _x < x && _x > bestX ? _x : bestX;
    }, nearestNeighborLeft)) !== -Infinity && nearestNeighborLeft === nearestNeighborLeft) {
      E[`${x}|${y}`].push({x: nearestNeighborLeft, y});
    }
    if((nearestNeighborRight = Object.keys(XI).reduce((bestX, _xStr) => {
      const _x = +_xStr;
      return `${_x}|${y}` in E && _x > x && _x < bestX ? _x : bestX;
    }, nearestNeighborRight)) !== Infinity && nearestNeighborRight === nearestNeighborRight) {
      E[`${x}|${y}`].push({x: nearestNeighborRight, y});
    }
  });

  return new Graph(V, E);
}

export default makeRoutingGraph;
