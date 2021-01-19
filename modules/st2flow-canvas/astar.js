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

// This code is derived from javascript-astar 0.4.1
// http://github.com/bgrins/javascript-astar
// Copyright (c) Brian Grinstead, http://briangrinstead.com, licensed MIT
// Includes Binary Heap (with modifications) from Marijn Haverbeke.
// http://eloquentjavascript.net/appendix2.html

import { ORBIT_DISTANCE } from '@stackstorm/st2flow-canvas/const';

function pathTo(node) {
  let curr = node;
  const path = [];
  while (curr.parent) {
    path.unshift(curr);
    curr = curr.parent;
  }
  return path;
}

function getHeap() {
  return new BinaryHeap((node) => {
    return node.f;
  });
}


/*
Notes from B. Momberger on 2018-11-21: the following is an exceprt from
https://pdfs.semanticscholar.org/9f60/6a3b611e6ab7c2bcd4c1f79fb8585dda8be2.pdf
and


[E]ntries in the priority queue have form (v, D, lv, bv, p, cv) where:
 v is the node in the orthogonal visibility graph;
 D is the “direction of entry” to the node;
 lv is the length of the partial path from s (start node) to v;
 bv the number of *bends* in the partial path;
 p a pointer to the parent entry (so that the final path can be reconstructed);
 and cv the cost of the partial path.

There is at most one entry
popped from the queue for each (v, D) pair. When an entry (v, D, lv, bv, p, cv)
is scheduled for addition to the priority queue, it is only added if no entry with
the same (v, D) pair has been removed from the queue, i.e. is on the closed list.
And only the entry with lowest cost for each (v, D) pair is kept on the priority
queue.
When we remove entry (v, D, lv, bv, p, cv) from the priority queue we
1. add the neighbour (v0, D) in the same direction with priority
    f(lv + ||(v, v0)||1 + ||(v0, d)||1, sv + sd);
    another way of saying that first arg is the sum of how far we've come, how far we're going, and how far we'll have left to go.
    and for the second... sv isn't actually specified in the paper. but i think it's the cost of the node up to know
2. add the neighbours (v0, right(D)) and (v0, left(D)) at right angles to the entry
  with priority f(lv + ||(v, v0)||1 + ||(v0, d)||1, sv + 1 + sd);
  So turning adds one cost to the path (1 + sd);

Let dirns((x1, y1), (x2, y2)) be the set of cardinal directions of the line (x1, y1) to (x2, y2)
Range[dirns] = { {N}, {S}, {E}, {W}, {N,E}, {N,W}, {S,E}, {S,W} }
Let left() and right() be bijective functions over the range of dirns(), inverse of each other
   (the mapping of left() and right() should be intuitive)
Let reverse() be a bijective function over the range of dirns()

sd is the estimation of the remaining segments required for the route from
(v0, D0) to (d, Dd). The estimation of the remaining segments required is: sd =...

0: if D0 = Dd and dirns(v0, d) = {D0};  (if we are moving straight towards the destination in the final direction)
1: if left(Dd) = D0 ∨ right(Dd) = D0
    and D0 ∈ dirns(v0, d); (i.e. if you can turn 90 degrees or less to the final direction)
2: if D0 = Dd and dirns(v0, d) != {D0}
    but D0 ∈ dirns(v0, d),
    or D0 = reverse(Dd) and dirns(v0, d) != {Dd};  (two turns to chicane into alignment with Dd or turn around)
3: if left(Dd) = D0 ∨ right(Dd) = D0 and D0 !∈ dirns(v0, d); (we're going away from d in a perpendicular direction to final)
4: if D0 = reverse(Dd) and dirns(v0, d) = {Dd},
    or D0 = Dd and D0 !∈ dirns(v0, d).  (going directly away from d in the opposite direction, or at d in the wrong direction)
*/
function left(from) {
  return { N: 'W', W: 'S', S: 'E', E: 'N'}[from];
}
function right(from) {
  return { N: 'E', W: 'N', S: 'W', E: 'S'}[from];
}
function reverse(from) {
  return { N: 'S', W: 'E', S: 'N', E: 'W'}[from];
}

export const astar = {
  /**
  * Perform an A* Search on a graph given a start and end node.
  * @param {Array} graph
  * @param {GridNode} start
  * @param {GridNode} end
  * @param {Object} [options]
  * @param {bool} [options.closest] Specifies whether to return the
             path to the closest node if the target is unreachable.
  * @param {Function} [options.heuristic] Heuristic function (see
  *          astar.heuristics).
  */
  search: function(
    graph: Graph,
    _start: {x: number, y: number},
    _end: {x: number, y: number}) {
    const start = graph.nodes[`${_start.x}|${_start.y}|S`];
    let end = graph.nodes[`${_end.x}|${_end.y}|S`];
    if(!start || !end) {
      return [];
    }

    // We have to do a little setup here.  First, we also create a node for the
    //   arrow point at the end, which is what actually ends at the task box.
    //   This is 10px below the supplied "end" for this graph; if we did the full
    //   orbit of 20px, then the arrow point would be under the task bubble.
    const endTag = `${end.x}|${end.y + ORBIT_DISTANCE / 2}|S`;
    let postEnd;
    if(!graph.nodes[endTag]) {
      postEnd = new GridNode(end.x, end.y + ORBIT_DISTANCE / 2, 'S', 1);
      graph.nodes[endTag] = postEnd;
      graph.grid[endTag] = [];
      [ 'S', 'E', 'W' ].forEach(dir => {
        if(graph.grid[`${end.toString()}|${dir}`].indexOf(endTag) < 0) {
          graph.grid[`${end.toString()}|${dir}`].push(endTag);
        }
      });
    }
    else {
      postEnd = graph.nodes[endTag];
    }
    // Then make that the new end point
    const preEnd = end;
    end = postEnd;
    // and make sure the pre-end node can be accessed. If it's within the orbit
    //   of another task box, it might be disconnected from the graph.
    graph.neighbors(preEnd).forEach(neighbor => {
      const revDir = reverse(neighbor.dir);
      [ 'N', 'S', 'E', 'W' ].forEach(dir => {
        if(graph.grid[`${neighbor.toString()}|${dir}`] &&
            graph.grid[`${neighbor.toString()}|${dir}`].indexOf(`${preEnd.toString()}|${revDir}`) < 0
        ) {
          graph.grid[`${neighbor.toString()}|${dir}`].push(`${preEnd.toString()}|${revDir}`);
        }
      });
    });

    const heuristic = astar.heuristic;

    const openHeap = getHeap();

    // make sure graph is clean
    graph.init();

    start.h = heuristic(start, end);

    openHeap.push(start);

    while (openHeap.size() > 0) {

      // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
      const currentNode = openHeap.pop();

      // End case -- result has been found, return the traced path.
      if (currentNode === end) {
        return pathTo(currentNode);
      }

      // Normal case -- move currentNode from open to closed, process each of its neighbors.
      currentNode.closed = true;

      // Find all neighbors for the current node.
      const neighbors = graph.neighbors(currentNode);

      for (let i = 0, il = neighbors.length; i < il; ++i) { // eslint-disable-line no-plusplus
        const neighbor = neighbors[i];

        if (neighbor.closed || graph.neighbors(neighbor).length < 2 && neighbor !== end) {
          // Not a valid node to process, skip to next neighbor.
          continue;
        }

        // The g score is the shortest distance from start to current node.
        // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
        const gScore = currentNode.g + neighbor.getCost(currentNode);
        const beenVisited = neighbor.visited;

        if (!beenVisited || gScore < neighbor.g) {

          // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
          neighbor.visited = true;
          neighbor.parent = currentNode;
          neighbor.h = neighbor.h || heuristic(neighbor, end);
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
          graph.markDirty(neighbor);

          if (!beenVisited) {
            // Pushing to heap will put it in proper place based on the 'f' value.
            openHeap.push(neighbor);
          }
          else {
            // Already seen the node, but since it has been rescored we need to reorder it in the heap
            openHeap.rescoreElement(neighbor);
          }
        }
      }
    }

    // No result was found, else would have returned in line 79
    //  - empty array signifies failure to find path.
    return [];
  },
  // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
  heuristic: function(pos0, pos1) {
    const d1 = pos1.x - pos0.x;
    const d2 = pos1.y - pos0.y;
    let h = Math.abs(d1) + Math.abs(d2);

    let dirV = '';
    if(d2 < 0) {
      dirV = 'N';
    }
    else if(d2 > 0) {
      dirV = 'S';
    }
    if(d1 > 0) {
      dirV += 'E';
    }
    else if(d1 < 0) {
      dirV += 'W';
    }

    // 0: if D0 = Dd and dirns(v0, d) = {D0};  (if we are moving straight towards the destination in the final direction)
    if(pos0.dir === pos1.dir && dirV === pos0.dir) {
      // don't add anything to the weight.  We're moving toward the destination.
    }
    // 1: if left(Dd) = D0 ∨ right(Dd) = D0
    //     and D0 ∈ dirns(v0, d); (i.e. if you can turn 90 degrees or less to the final direction)
    else if(dirV.indexOf(pos0.dir) > -1 && (left(pos0.dir) === pos1.dir || right(pos0.dir) === pos1.dir)) {
      h += 1;
    }
    // 2: if D0 = Dd and dirns(v0, d) != {D0}
    //     but D0 ∈ dirns(v0, d),
    //     or D0 = reverse(Dd) and dirns(v0, d) != {Dd};  (two turns to chicane into alignment with Dd or turn around)
    else if(pos0.dir === pos1.dir && (dirV.indexOf(pos0.dir) > -1 || pos0.dir === reverse(pos1.dir) && dirV !== pos1.dir)) {
      h += 2;
    }
    // 3: if left(Dd) = D0 ∨ right(Dd) = D0 and D0 !∈ dirns(v0, d); (we're going away from d in a perpendicular direction to final)
    else if((left(pos1.dir) === pos0.dir || right(pos1.dir) === pos0.dir) && dirV.indexOf(pos0.dir) < 0) {
      h += 3;
    }
    // 4: if D0 = reverse(Dd) and dirns(v0, d) = {Dd},
    //     or D0 = Dd and D0 !∈ dirns(v0, d).  (going directly away from d in the opposite direction, or at d in the wrong direction)
    else if(reverse(pos1.dir) === pos0.dir && dirV === pos1.dir || pos1.dir === pos0.dir && dirV.indexOf(pos0.dir) < 0) {
      h += 4;
    }

    return h;
  },
  cleanNode: function(node: GridNode) {
    node.f = 0;
    node.g = 0;
    node.h = 0;
    node.visited = false;
    node.closed = false;
    node.parent = null;
  },
};


export class Graph {
  nodes: {[string]: GridNode};  // map x|y coords to GridNodes
  grid: {[string]: Array<string>} = {}; // map x|y coords to nearest-neighbor x|y coords
  dirtyNodes: Array<GridNode> = []; // hold nodes which are dirty

  constructor(vertices: Array<{x: number, y: number}>, edges: { [string]: Array<{x: number, y: number}> }) {
    this.nodes = vertices.reduce((nodes, v) => {
      [ 'N', 'S', 'E', 'W' ].forEach(dir => {
        const gn = new GridNode(v.x, v.y, dir, 1);
        this.grid[`${gn.toString()}|${gn.dir}`] = edges[gn.toString()].map(({x, y}) => {
          switch(true) {
            case (x > v.x): return `${x}|${y}|E`;
            case (x < v.x): return `${x}|${y}|W`;
            case (y > v.y): return `${x}|${y}|S`;
            case (y < v.y): return `${x}|${y}|N`;
            default: return `${x}|${y}`;
          }
        });
        nodes[`${gn.toString()}|${gn.dir}`] = gn;
      });
      return nodes;
    }, {});
    this.init();
  }
  init() {
    this.dirtyNodes = [];
    const keys = Object.keys(this.nodes);
    for (let i = 0; i < keys.length; i=i+1) {
      astar.cleanNode(this.nodes[keys[i]]);
    }
  }

  cleanDirty() {
    for (let i = 0; i < this.dirtyNodes.length; i=i+1) {
      astar.cleanNode(this.dirtyNodes[i]);
    }
    this.dirtyNodes = [];
  }

  markDirty(node: GridNode) {
    this.dirtyNodes.push(node);
  }

  neighbors(node: GridNode) {
    return this.grid[`${node.toString()}|${node.dir}`].map(vStr => this.nodes[vStr]).filter(node => node);
  }
}


export class GridNode {
  // grid coordinates
  x: number;
  y: number;
  // inbound direction of node.
  dir: string;
  // weight of node itself
  weight: number;
  // calculated forms
  f: number = 0;
  g: number = 0; // cost of node plus cost of parent?
  h: number = 0;
  // traversal state
  visited: boolean = false;
  closed: boolean = false;
  parent: GridNode = null;
  // direction: Direction = null;

  constructor(x, y, dir, weight) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.weight = weight;
  }

  toString(): string {
    return `${this.x}|${this.y}`;
  }

  getCost(fromNeighbor: GridNode): number {
    let weight = this.weight;
    const length = (Math.abs(fromNeighbor.x - this.x) + Math.abs(fromNeighbor.y - this.y));

    // This path *bends* if the dirs don't match up, so increase the cost
    if(fromNeighbor.dir !== this.dir) {
      weight += 1;
    }

    return weight + length;
  }
}

class BinaryHeap {
  scoreFunction: Function;
  content: Array<GridNode>;

  constructor(scoreFunction: Function) {
    this.content = [];
    this.scoreFunction = scoreFunction;
  }

  push(element: GridNode) {
    // Add the new element to the end of the array.
    this.content.push(element);

    // Allow it to sink down.
    this.sinkDown(this.content.length - 1);
  }
  pop(): GridNode {
    // Store the first element so we can return it later.
    const result = this.content[0];
    // Get the element at the end of the array.
    const end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it bubble up.
    if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
    }
    return result;
  }
  remove(node: GridNode) {
    const i = this.content.indexOf(node);

    // When it is found, the process seen in 'pop' is repeated
    // to fill up the hole.
    const end = this.content.pop();

    if (i !== this.content.length - 1) {
      this.content[i] = end;

      if (this.scoreFunction(end) < this.scoreFunction(node)) {
        this.sinkDown(i);
      }
      else {
        this.bubbleUp(i);
      }
    }
  }
  size(): number {
    return this.content.length;
  }
  rescoreElement(node: GridNode) {
    this.sinkDown(this.content.indexOf(node));
  }
  sinkDown(n: number) {
    // Fetch the element that has to be sunk.
    const element = this.content[n];

    // When at 0, an element can not sink any further.
    while (n > 0) {

      // Compute the parent element's index, and fetch it.
      const parentN = ((n + 1) >> 1) - 1; //eslint-disable-line no-bitwise
      const parent = this.content[parentN];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        // Update 'n' to continue at the new position.
        n = parentN;
      }
      // Found a parent that is less, no need to sink any further.
      else {
        break;
      }
    }
  }
  bubbleUp(n: number) {
    // Look up the target element and its score.
    const length = this.content.length;
    const element = this.content[n];
    const elemScore = this.scoreFunction(element);

    // This is used to store the new position of the element, if any.
    let swap = null;
    do {
      swap = null;
      // Compute the indices of the child elements.
      const child2N = (n + 1) << 1; //eslint-disable-line no-bitwise
      const child1N = child2N - 1;
      // If the first child exists (is inside the array)...
      let child1Score;
      if (child1N < length) {
        // Look it up and compute its score.
        const child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);

        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore) {
          swap = child1N;
        }
      }

      // Do the same checks for the other child.
      if (child2N < length) {
        const child2 = this.content[child2N];
        const child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }

      // If the element needs to be moved, swap it, and continue.
      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
    } while(swap !== null);
  }
}

export default astar;
