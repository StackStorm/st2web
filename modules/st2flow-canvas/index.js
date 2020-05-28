// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

//@flow

import type {
  CanvasPoint,
  TaskInterface,
  TaskRefInterface,
  TransitionInterface,
} from '@stackstorm/st2flow-model/interfaces';
import type { NotificationInterface } from '@stackstorm/st2flow-notifications';
import type { Node } from 'react';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import fp from 'lodash/fp';
import { uniqueId, uniq } from 'lodash';

import Notifications from '@stackstorm/st2flow-notifications';
import {HotKeys} from 'react-hotkeys';

import type { BoundingBox } from './routing-graph';
import Task from './task';
import TransitionGroup from './transition';
import Vector from './vector';
import CollapseButton from './collapse-button';
import { Graph } from './astar';
import { ORBIT_DISTANCE } from './const';
import { Toolbar, ToolbarButton } from './toolbar';
import makeRoutingGraph from './routing-graph';
import PoissonRectangleSampler from './poisson-rect';

import { origin } from './const';

import style from './style.css';

type DOMMatrix = {
  m11: number,
  m22: number
};

type Wheel = WheelEvent & {
  wheelDelta: number
}

// Order tasks before placement based on "weight" (bucket size)
//  and "order" (longest non-looping transition path to task)
function weightedOrderedTaskSort(a, b) {
  if (a.weight > b.weight) {
    return -1;
  }
  else if (a.weight < b.weight) {
    return 1;
  }
  else if (a.priority < b.priority) {
    return -1;
  }
  else if (a.priority > b.priority) {
    return 1;
  }
  else if (a.order < b.order) {
    return -1;
  }
  else if (a.order > b.order) {
    return 1;
  }
  else {
    return 0;
  }
}

// given tasks and their undirected connections to other tasks,
//  sort the tasks into buckets of connected tasks.
// This helps layout because it ensures that connected tasks can be drawn
// near each other.
function constructTaskBuckets(
  tasks: Array<TaskInterface>,
  transitionsByTaskBidi: {[string]: Array<string>}
): Array<Array<string>> {
  // start by creating buckets of connected tasks.
  const taskBuckets = tasks.map(task => [ task.name ]);
  let foundChange = true;
  const doBucketPass = taskBucket => {
    const bucketsByTask = {};
    taskBuckets.forEach(bucket => {
      bucket.forEach(taskName => {
        bucketsByTask[taskName] = bucket;
      });
    });
    taskBucket.forEach(taskName => {
      if (transitionsByTaskBidi[taskName].length) {
        transitionsByTaskBidi[taskName].forEach(newTask => {
          const connectedTaskBucket = bucketsByTask[newTask];
          if(connectedTaskBucket && connectedTaskBucket !== taskBucket) {
            taskBucket.push(...connectedTaskBucket);
            taskBuckets.splice(taskBuckets.indexOf(connectedTaskBucket), 1);
            connectedTaskBucket.forEach(connectedTask => {
              bucketsByTask[connectedTask] = taskBucket;
            });
            foundChange = true;
          }
        });
      }
    });
  };
  while(foundChange) {
    foundChange = false;
    taskBuckets.forEach(doBucketPass);
  }
  return taskBuckets;
}

// given tasks, their buckets from constructTaskBuckets(), and outward transitions for each task,
//   determine the order that items should be placed in, expecting that if there is a transition
//   a->b, a should be placed before b so b can be placed south of a.  also size the buckets for
//   each task so the larget bucket gets placed first.
function constructPathOrdering(
  tasks: Array<TaskInterface>,
  taskBuckets: Array<Array<string>>,
  transitionsByTask: { [string]: Array<string> }
): {
  taskInDegree: {[string]: number},
  taskBucketSize: {[string]: number},
  taskBucketPriority: {[string]: number},
} {
  const taskBucketSize: {[string]: number} = tasks.reduce((tbs, task: TaskInterface) => {
    tbs[task.name] = 0;
    return tbs;
  }, {});
  const taskInDegree = { ...taskBucketSize };
  const taskBucketPriority = { ...taskBucketSize };

  const followPaths = (task, nextTasks, inDegree, nonVisitedTransitions) => {
    const recurseNext = nextTasks.map(nextTask => {
      const recurseThis = nextTask in nonVisitedTransitions ? nonVisitedTransitions[nextTask] : null;
      taskInDegree[nextTask] = Math.max(taskInDegree[nextTask], inDegree);
      delete nonVisitedTransitions[nextTask];
      return recurseThis;
    });
    nextTasks.forEach((nextTask, idx) => {
      if(recurseNext[idx]) {
        followPaths(nextTask, recurseNext[idx], inDegree + 1, nonVisitedTransitions);
      }
    });
  };
  // sort each bucket by perceived in-degree;
  taskBuckets.forEach(keyBucket => {
    // start by ordering the bucket in original task order
    let firstIndex;
    const bucket = tasks.filter((task, idx) => {
      if(keyBucket.includes(task.name)) {
        if (typeof firstIndex === 'undefined') {
          firstIndex = idx;
        }
        return true;
      }
      else {
        return false;
      }
    }).map(task => task.name);
    bucket.forEach(taskName => {
      taskBucketSize[taskName] = bucket.length;
      taskBucketPriority[taskName] = firstIndex;
    });
    bucket.forEach(nextTask => {
      followPaths(
        nextTask,
        transitionsByTask[nextTask],
        1,
        Object.assign({}, transitionsByTask)
      );
    });
  });
  return {
    taskInDegree,
    taskBucketSize,
    taskBucketPriority,
  };
}

@connect(
  ({ flow: { tasks, transitions, notifications, nextTask, panels, navigation }}) => ({ tasks, transitions, notifications, nextTask, isCollapsed: panels, navigation }),
  (dispatch) => ({
    issueModelCommand: (command, ...args) => {
      dispatch({
        type: 'MODEL_ISSUE_COMMAND',
        command,
        args,
      });
    },
    toggleCollapse: name => dispatch({
      type: 'PANEL_TOGGLE_COLLAPSE',
      name,
    }),
    navigate: (navigation) => dispatch({
      type: 'CHANGE_NAVIGATION',
      navigation,
    }),
  })
)
export default class Canvas extends Component<{
  children: Node,
      className?: string,

  navigation: Object,
  navigate: Function,

  tasks: Array<TaskInterface>,
  transitions: Array<Object>,
  notifications: Array<NotificationInterface>,
  issueModelCommand: Function,
  nextTask: string,

  isCollapsed: Object,
  toggleCollapse: Function,
}, {
      scale: number,
}> {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,

    navigation: PropTypes.object,
    navigate: PropTypes.func,

    tasks: PropTypes.array,
    transitions: PropTypes.array,
    notifications: PropTypes.array,
    issueModelCommand: PropTypes.func,
    nextTask: PropTypes.string,

    isCollapsed: PropTypes.object,
    toggleCollapse: PropTypes.func,
  }

  state = {
    scale: 0,
  }

  componentDidMount() {
    const el = this.canvasRef.current;

    if (!el) {
      return;
    }

    el.addEventListener('wheel', this.handleMouseWheel);
    el.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('resize', this.handleUpdate);
    el.addEventListener('dragover', this.handleDragOver);
    el.addEventListener('drop', this.handleDrop);

    this.handleUpdate();
  }

  componentDidUpdate() {
    this.handleUpdate();
  }

  componentWillUnmount() {
    const el = this.canvasRef.current;

    if (!el) {
      return;
    }

    el.removeEventListener('wheel', this.handleMouseWheel);
    el.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('resize', this.handleUpdate);
    el.removeEventListener('dragover', this.handleDragOver);
    el.removeEventListener('drop', this.handleDrop);
  }

  size: CanvasPoint
  drag: boolean
  startx: number
  starty: number

  handleUpdate = () => {
    const canvasEl = this.canvasRef.current;
    const surfaceEl = this.surfaceRef.current;

    if (!canvasEl || !surfaceEl) {
      return;
    }

    const { transitions } = this.props;
    let tasks = this.props.tasks.slice(0);
    const { width, height } = canvasEl.getBoundingClientRect();

    const scale = Math.E ** this.state.scale;

    this.size = tasks.reduce((acc, item) => {
      const coords = new Vector(item.coords);
      const size = new Vector(item.size);
      const { x, y } = coords.add(size).add(50);

      return {
        x: Math.max(x, acc.x),
        y: Math.max(y, acc.y),
      };
    }, {
      x: width / scale,
      y: height / scale,
    });

    surfaceEl.style.width = `${(this.size.x).toFixed()}px`;
    surfaceEl.style.height = `${(this.size.y).toFixed()}px`;

    // take the log base sqrt(2) of the number of
    const logTaskCount = Math.log(tasks.length) / Math.log(Math.sqrt(2));

    if(surfaceEl.style.width) {
      const needsCoords = [];
      const sampler = new PoissonRectangleSampler(
        Math.max(parseInt(surfaceEl.style.width) - 211, logTaskCount * (150 + ORBIT_DISTANCE / 2)),
        Math.max(parseInt(surfaceEl.style.height) - 55, logTaskCount * (76 + ORBIT_DISTANCE)),
        211 + ORBIT_DISTANCE * 2,
        55 + ORBIT_DISTANCE * 3,
        50
      );
      // start by indexing the transitions by task, both in the directed form for determining ordering
      //  and in the bidirectional (undirected) form for determining connected subgraphs.
      const transitionsByTask = tasks.reduce((tbt, task) => {
        tbt[task.name] = uniq([].concat(
          ...transitions
            .filter(t => t.from.name === task.name)
            .map(t => t.to),
        ).map(t => t.name));
        return tbt;
      }, {});

      const transitionsByTaskBidi = tasks.reduce((tbt, task) => {
        tbt[task.name] = uniq(transitionsByTask[task.name].concat(
          transitions
            .filter(t => t.to.map(tt => tt.name).includes(task.name))
            .map(t => t.from.name)
        ));
        return tbt;
      }, {});
      // Get the "buckets" (subgraphs) of connected tasks in the graph.
      const taskBuckets = constructTaskBuckets(tasks, transitionsByTaskBidi);
      // For each task, determine its bucket size (biggest bucket gets rendered first)
      //   and the longest non-looping path of transitions to it
      //   (misnamed in-degree here for want of a better word).
      // Where there is a loop in transitions, the ordering may be arbitrary
      //  but it makes an attempt to place downward then loop to
      //  the top from the bottom.
      const {
        taskInDegree,
        taskBucketSize,
        taskBucketPriority,
      } = constructPathOrdering(tasks, taskBuckets, transitionsByTask);

      tasks = tasks.map((task) => ({
        task,
        weight: taskBucketSize[task.name],
        order: taskInDegree[task.name],
        priority: taskBucketPriority[task.name],
      }))
        .sort(weightedOrderedTaskSort)
        .map(t => t.task);
      // Now take each task and the transitions starting from that task, and prefill them
      //   into the sampler if placed (i.e. if has coordinates).  If not placed, queue for
      //   placement.  Placement has to happen after prefill because the sampler has to
      //   know where all the items with fixed placement are before placing new ones.
      tasks.forEach(task => {
        const transitionsTo = [].concat(
          ...transitions
            .filter(t => t.from.name === task.name)
            .map(t => t.to)
        ).map(t => t.name);

        if(task.coords.x < 0 || task.coords.y < 0) {
          needsCoords.push({task, transitionsTo});
        }
        else {
          const { x, y } = task.coords;
          sampler.prefillPoint(x, y, transitionsTo);
        }
      });
      // finally, place the unplaced tasks.  using handleTaskMove will also ensure
      //   that the placement gets set on the model and the YAML.
      needsCoords.forEach(({task, transitionsTo}) => {
        this.handleTaskMove(task, sampler.getNext(task.name, transitionsTo));
      });
    }
  }

  handleMouseWheel = (e: Wheel): ?false => {
    // considerations on scale factor (BM, 2019-02-07)
    // on Chrome Mac and Safari Mac:
    // For Mac trackpads with continuous scroll, wheelDelta is reported in multiples of 3,
    //   but for a fast scoll, the delta value may be >1000.
    //   deltaY is always wheelDelta / -3.
    // For traditional mouse wheels with clicky scroll, wheelDelta is reported in multiples of 120.
    //   deltaY is non-integer and does not neatly gazinta wheelDelta.
    //
    // Firefox Mac:  wheelDelta is undefined. deltaY increments by 1 for trackpad or mouse wheel.
    //
    // On Windows w/Edge, I see a ratio of -20:7 between wheelDelta and deltaY. I'm using a VM, but the Mac
    //   trackpad and the mouse report the same ratio. (increments of 120:-42)
    // On Windows w/Chrome, the ratio is -6:5. The numbers don't seem to go above 360 for wheelDelta on a mousewheel
    //    or 600 for the trackpad
    //
    // Firefox Linux: wheelDelta is undefined, wheelY is always 3 or -3
    // Chromium Linus: wheelY is always in multiples of 53.  Fifty-three!  (wheelDelta is in multiples of 120)
    //   There's very little variation.  I can sometimes get the trackpad to do -212:480, but not a real mouse wheel
    const SCALE_FACTOR_MAC_TRACKPAD = .05;
    const SCROLL_FACTOR_MAC_TRACKPAD = 15;
    const SCALE_FACTOR_DEFAULT = .1;
    const SCROLL_FACTOR_DEFAULT = 30;

    const getModifierState = (e.getModifierState || function(mod) {
      mod = mod === 'Control' ? 'ctrl' : mod;
      return this[`${mod.toLowerCase()}Key`];
    }).bind(e);

    if(getModifierState('Control')) {
      e.preventDefault();
      const canvasEl = this.canvasRef.current;
      if(canvasEl instanceof HTMLElement) {
        const scrollFactor = e.wheelDelta && Math.abs(e.wheelDelta) < 120
          ? SCROLL_FACTOR_MAC_TRACKPAD
          : Math.abs(e.wheelDelta) < 3 ? SCROLL_FACTOR_DEFAULT / 2 : SCROLL_FACTOR_DEFAULT;
        canvasEl.scrollLeft += (e.deltaY < 0) ? -scrollFactor : scrollFactor;
      }

      return undefined;
    }

    if(getModifierState('Alt')) {
      e.preventDefault();
      e.stopPropagation();

      const { scale }: { scale: number } = this.state;
      const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.deltaY));

      // Zoom around the mouse pointer, by finding it's position normalized to the
      //  canvas and surface elements' coordinates, and moving the scroll on the
      //  canvas element to match the same proportions as before the scale.
      const canvasEl = this.canvasRef.current;
      const surfaceEl = this.surfaceRef.current;
      if(canvasEl instanceof HTMLElement && surfaceEl instanceof HTMLElement) {
        let canvasParentEl = canvasEl;
        let canvasOffsetLeft = 0;
        let canvasOffsetTop = 0;
        do {
          if(getComputedStyle(canvasParentEl).position !== 'static') {
            canvasOffsetLeft += canvasParentEl.offsetLeft || 0;
            canvasOffsetTop += canvasParentEl.offsetTop || 0;
          }
          canvasParentEl = canvasParentEl.parentNode;
        } while (canvasParentEl && canvasParentEl !== document);
        const surfaceScaleBefore: DOMMatrix = new window.DOMMatrix(getComputedStyle(surfaceEl).transform);
        const mousePosCanvasX = (e.clientX - canvasOffsetLeft) / canvasEl.clientWidth;
        const mousePosCanvasY = (e.clientY - canvasOffsetTop) / canvasEl.clientHeight;
        const mousePosSurfaceX = (e.clientX - canvasOffsetLeft + canvasEl.scrollLeft) /
                                  (surfaceEl.clientWidth * surfaceScaleBefore.m11);
        const mousePosSurfaceY = (e.clientY - canvasOffsetTop + canvasEl.scrollTop) /
                                  (surfaceEl.clientHeight * surfaceScaleBefore.m22);
        this.setState({
          scale: scale + delta * (e.wheelDelta && Math.abs(e.wheelDelta) < 120 ? SCALE_FACTOR_MAC_TRACKPAD: SCALE_FACTOR_DEFAULT),
        });

        const surfaceScaleAfter: DOMMatrix = new window.DOMMatrix(getComputedStyle(surfaceEl).transform);
        canvasEl.scrollLeft = surfaceEl.clientWidth * surfaceScaleAfter.m11 * mousePosSurfaceX -
                                canvasEl.clientWidth * mousePosCanvasX;
        canvasEl.scrollTop = surfaceEl.clientHeight * surfaceScaleAfter.m22 * mousePosSurfaceY -
                                canvasEl.clientHeight * mousePosCanvasY;
      }

      this.handleUpdate();

      return false;
    }
    else {
      return undefined;
    }
  }

  handleMouseDown = (e: MouseEvent) => {
    if (e.target !== this.surfaceRef.current) {
      return true;
    }

    e.preventDefault();
    e.stopPropagation();

    this.drag = true;

    const el = this.canvasRef.current;

    if (!el) {
      return true;
    }

    this.startx = e.clientX + el.scrollLeft;
    this.starty = e.clientY + el.scrollTop;

    return false;
  }

  handleMouseUp = (e: MouseEvent) => {
    if (!this.drag) {
      return true;
    }

    e.preventDefault();
    e.stopPropagation();

    this.drag = false;

    return false;
  }

  handleMouseMove = (e: MouseEvent) => {
    if (!this.drag) {
      return true;
    }

    e.preventDefault();
    e.stopPropagation();

    const el = this.canvasRef.current;

    if (!el) {
      return true;
    }

    el.scrollLeft += (this.startx - (e.clientX + el.scrollLeft));
    el.scrollTop += (this.starty - (e.clientY + el.scrollTop));

    return false;
  }

  handleDragOver = (e: DragEvent) => {
    if (e.target !== this.surfaceRef.current) {
      return true;
    }

    if (e.preventDefault) {
      e.preventDefault();
    }

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }

    return false;
  }

  handleDrop = (e: DragEvent) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    if (!e.dataTransfer) {
      return true;
    }

    const { action, handle } = JSON.parse(e.dataTransfer.getData('application/json'));

    const coords = new Vector(e.offsetX, e.offsetY).subtract(new Vector(handle)).subtract(new Vector(origin));

    this.props.issueModelCommand('addTask', {
      name: this.props.nextTask,
      action: action.ref,
      coords: Vector.max(coords, new Vector(0, 0)),
    });

    return false;
  }

  handleTaskMove = (task: TaskRefInterface, coords: CanvasPoint) => {
    this.props.issueModelCommand('updateTask', task, { coords });
  }

  handleTaskSelect = (task: TaskRefInterface) => {
    this.props.navigate({ task: task.name, toTasks: undefined, type: 'execution', section: 'input' });
  }

  handleTransitionSelect = (e: MouseEvent, transition: TransitionInterface) => {
    e.stopPropagation();
    this.props.navigate({ task: transition.from.name, toTasks: transition.to.map(t => t.name), type: 'execution', section: 'transitions' });
  }

  handleCanvasClick = (e: MouseEvent) => {
    e.stopPropagation();
    this.props.navigate({ task: undefined, toTasks: undefined, section: undefined, type: 'metadata' });
  }

  handleTaskEdit = (task: TaskRefInterface) => {
    this.props.navigate({ toTasks: undefined, task: task.name });
  }

  handleTaskDelete = (task: TaskRefInterface) => {
    this.props.issueModelCommand('deleteTask', task);
  }

  handleTaskConnect = (to: TaskRefInterface, from: TaskRefInterface) => {
    this.props.issueModelCommand('addTransition', { from, to: [ to ] });
  }

  handleTransitionDelete = (transition: TransitionInterface) => {
    this.props.issueModelCommand('deleteTransition', transition);
  }

  get notifications() : Array<NotificationInterface> {
    return this.props.notifications;
  }
  get errors() : Array<NotificationInterface> {
    return this.props.notifications.filter(n => n.type === 'error');
  }

  style = style
  canvasRef = React.createRef();
  surfaceRef = React.createRef();
  taskRefs = {};

  get transitionRoutingGraph(): Graph {
    const { taskRefs } = this;

    const boundingBoxes: Array<BoundingBox> = Object.keys(taskRefs).map((key: string): BoundingBox => {

      if(taskRefs[key].current) {
        const task: TaskInterface = taskRefs[key].current.props.task;

        const coords = new Vector(task.coords).add(origin);
        const size = new Vector(task.size);

        return {
          left: coords.x - ORBIT_DISTANCE,
          top: coords.y - ORBIT_DISTANCE,
          bottom: coords.y + size.y + ORBIT_DISTANCE,
          right: coords.x + size.x + ORBIT_DISTANCE,
          midpointY: coords.y + size.y / 2,
          midpointX: coords.x + size.x / 2,
        };
      }
      else {
        return {
          left: NaN,
          top: NaN,
          bottom: NaN,
          right: NaN,
          midpointY: NaN,
          midpointX: NaN,
        };
      }
    });

    return makeRoutingGraph(boundingBoxes);
  }

  render() {
    const { notifications, children, navigation, tasks=[], transitions=[], isCollapsed, toggleCollapse } = this.props;
    const { scale } = this.state;
    const { transitionRoutingGraph } = this;

    const surfaceStyle = {
      transform: `scale(${Math.E ** scale})`,
    };

    const transitionGroups = transitions
      .map(transition => {
        const from = {
          task: tasks.find(({ name }) => name === transition.from.name),
          anchor: 'bottom',
        };

        const group = transition.to.map(tto => {
          const to = {
            task: tasks.find(({ name }) => name === tto.name) || {},
            anchor: 'top',
          };

          return {
            from,
            to,
          };
        });

        return {
          id: uniqueId(`${transition.from.name}-`),
          transition,
          group,
          color: transition.color,
        };
      });

    const selectedTask = tasks.filter(task => task.name === navigation.task)[0];

    const selectedTransitionGroups = transitionGroups
      .filter(({ transition }) => {
        const { task, toTasks = [] } = navigation;
        return transition.from.name === task && transition.to.length && fp.isEqual(toTasks, transition.to.map(t => t.name));
      });

    // Currently this component is registering global key handlers (attach = document.body)
    //   At some point it may be desirable to pull the global keyMap up to main.js (handlers
    //   can stay here), but for now since all key commands affect the canvas, this is fine.
    return (
      <HotKeys
        style={{height: '100%'}}
        focused={true}
        attach={document.body}
        handlers={{handleTaskDelete: e => {
          // This will break if canvas elements (tasks/transitions) become focus targets with
          //  tabindex or automatically focusing elements.  But in that case, the Task already
          //  has a handler for delete waiting.
          if(e.target === document.body) {
            e.preventDefault();
            if(selectedTask) {
              this.handleTaskDelete(selectedTask);
            }
          }
        }}}
      >
        <div
          className={cx(this.props.className, this.style.component)}
          onClick={e => this.handleCanvasClick(e)}
        >
          { children }
          <Toolbar position="right">
            <ToolbarButton key="zoomIn" icon="icon-zoom_in" title="Zoom in" onClick={() => this.setState({ scale: this.state.scale + .1 })} />
            <ToolbarButton key="zoomReset" icon="icon-zoom_reset" title="Reset zoom" onClick={() => this.setState({ scale: 0 })} />
            <ToolbarButton key="zoomOut" icon="icon-zoom_out" title="Zoom out" onClick={() => this.setState({ scale: this.state.scale - .1 })} />
          </Toolbar>
          <CollapseButton position="left" state={isCollapsed.palette} onClick={() => toggleCollapse('palette')} />
          <CollapseButton position="right" state={isCollapsed.details} onClick={() => toggleCollapse('details')} />
          <div className={this.style.canvas} ref={this.canvasRef}>
            <div className={this.style.surface} style={surfaceStyle} ref={this.surfaceRef}>
              {
                tasks.map((task) => {
                  this.taskRefs[task.name] = this.taskRefs[task.name] || React.createRef();
                  return (
                    <Task
                      key={task.name}
                      task={task}
                      selected={task.name === navigation.task && !selectedTransitionGroups.length}
                      scale={scale}
                      onMove={(...a) => this.handleTaskMove(task, ...a)}
                      onConnect={(...a) => this.handleTaskConnect(task, ...a)}
                      onClick={() => this.handleTaskSelect(task)}
                      onDelete={() => this.handleTaskDelete(task)}
                      ref={this.taskRefs[task.name]}
                    />
                  );
                })
              }
              {
                transitionGroups
                  .filter(({ transition }) => {
                    const { task, toTasks = [] } = navigation;
                    return transition.from.name === task && fp.isEqual(toTasks, transition.to.map(t => t.name));
                  })
                  .map(({ transition }) => {
                    const toPoint = transition.to
                      .map(task => tasks.find(({ name }) => name === task.name))
                      .map(task => new Vector(task.size).multiply(new Vector(.5, 0)).add(new Vector(0, -10)).add(new Vector(task.coords)))
                      ;

                    const fromPoint = [ transition.from ]
                      .map((task: TaskRefInterface): any => tasks.find(({ name }) => name === task.name))
                      .map((task: TaskInterface) => new Vector(task.size).multiply(new Vector(.5, 1)).add(new Vector(task.coords)))
                      ;

                    const point = fromPoint.concat(toPoint)
                      .reduce((acc, point) => (acc || point).add(point).divide(2))
                      ;

                    const { x, y } = point.add(origin);
                    return (
                      <div
                        key={`${transition.from.name}-${window.btoa(transition.condition)}-selected`}
                        className={cx(this.style.transitionButton, this.style.delete, 'icon-delete')}
                        style={{ transform: `translate(${x}px, ${y}px)`}}
                        onClick={() => this.handleTransitionDelete(transition)}
                      />
                    );
                  })
              }
              <svg className={this.style.svg} xmlns="http://www.w3.org/2000/svg">
                {
                  transitionGroups
                    .map(({ id, transition, group, color }, i) => (
                      <TransitionGroup
                        key={`${id}-${window.btoa(transition.condition)}`}
                        color={color}
                        transitions={group}
                        taskRefs={this.taskRefs}
                        graph={transitionRoutingGraph}
                        selected={false}
                        onClick={(e) => this.handleTransitionSelect(e, transition)}
                      />
                    ))
                }
                {
                  selectedTransitionGroups
                    .map(({ id, transition, group, color }, i) => (
                      <TransitionGroup
                        key={`${id}-${window.btoa(transition.condition)}-selected`}
                        color={color}
                        transitions={group}
                        taskRefs={this.taskRefs}
                        graph={transitionRoutingGraph}
                        selected={true}
                        onClick={(e) => this.handleTransitionSelect(e, transition)}
                      />
                    ))
                }
              </svg>
            </div>
          </div>
          <Notifications position="bottom" notifications={notifications} />
        </div>
      </HotKeys>
    );
  }
}
