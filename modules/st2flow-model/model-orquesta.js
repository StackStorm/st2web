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
import _ from 'lodash';

import type { ModelInterface, TaskInterface, TaskRefInterface, TransitionInterface } from './interfaces';
import type { TokenMeta, JPath, JpathKey } from '@stackstorm/st2flow-yaml';

import diff from 'deep-diff';
import { crawler } from '@stackstorm/st2flow-yaml';
import BaseModel from './base-model';

// The model schema is generated in the orquesta repo. Do not update it manually!
// https://github.com/StackStorm/orquesta/blob/master/docs/source/schemas/orquesta.json
// https://github.com/StackStorm/orquesta/blob/master/orquesta/specs/native/v1/models.py
import schema from './schemas/orquesta.json';

const REGEX_VALUE_IN_BRACKETS = '\\[.*\\]\\s*';
const REGEX_VALUE_IN_QUOTES = '\\"[^\\"]*\\"\\s*';
const REGEX_VALUE_IN_APOSTROPHES = '\'[^\']*\'\\s*';
const REGEX_FLOATING_NUMBER = '[-]?\\d*\\.\\d+';
const REGEX_INTEGER = '[-]?\\d+';
const REGEX_TRUE = 'true';
const REGEX_FALSE = 'false';
const REGEX_NULL = 'null';
const YQL_REGEX_PATTERN = '<%.*?%>';
const JINJA_REGEX_PATTERN = '{{.*?}}';

const REGEX_INLINE_PARAM_VARIATIONS = [
  REGEX_VALUE_IN_BRACKETS,
  REGEX_VALUE_IN_QUOTES,
  REGEX_VALUE_IN_APOSTROPHES,
  REGEX_FLOATING_NUMBER,
  REGEX_INTEGER,
  REGEX_TRUE,
  REGEX_FALSE,
  REGEX_NULL,
  YQL_REGEX_PATTERN,
  JINJA_REGEX_PATTERN,
];

const REGEX_INLINE_PARAMS = new RegExp(`([\\w]+)=(${REGEX_INLINE_PARAM_VARIATIONS.join('|')})(.*)`);

function matchAll(str: string, regexp: RegExp, accumulator: Object = {}) {
  const match = str.match(regexp);

  if (!match) {
    return accumulator;
  }

  const [ , key, value, rest ] = match;
  accumulator[key] = value;

  return matchAll(rest, regexp, accumulator);
}

// The following types are specific to Orquesta
type NextItem = {
  do?: string | Array<string>,
  when?: string,
  publish?: string | Array<Object>,
};

type NextItemInfo = {
  nextItem: NextItem,
  nextIndex: number,
  jpath: JPath,
  error?: Error,
};

type RawTask = {
  __meta: TokenMeta,
  action: string,
  input?: Object,
  next?: Array<NextItem>,
  with?: string | Object,
  join?: string
};

type RawTasks = {
  __meta: TokenMeta,
  [string]: RawTask,
};

const REG_COORDS = /\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/;

class OrquestaModel extends BaseModel implements ModelInterface {
  static runner_types = [
    'orquesta',
    'orchestra',
  ]

  static minimum = 'version: 1.0\ntasks: {}\n';

  constructor(yaml: ?string) {
    super(schema, yaml);
  }

  get input() {
    const inputs = crawler.getValueByKey(this.tokenSet, 'input');
    return inputs;
  }

  get vars() {
    const vars = crawler.getValueByKey(this.tokenSet, 'vars');
    return vars;
  }

  get tasks() {
    const tasks: RawTasks = crawler.getValueByKey(this.tokenSet, 'tasks');

    if(!tasks || !tasks.__meta.keys) {
      return [];
    }

    return tasks.__meta.keys.filter(n => !!tasks[n]).map(name => {
      const task = tasks[name];
      let coords = { x: -1, y: -1 };
      if(task.__meta && REG_COORDS.test(task.__meta.comments)) {
        const match = task.__meta.comments.match(REG_COORDS);
        if (match) {
          const [ , x, y ] = match;
          coords = {
            x: +x,
            y: +y,
          };
        }
      }

      const { action = '', input, 'with': _with, join } = task;
      const [ actionRef, ...inputPartials ] = `${action}`.split(' ');

      // if (inputPartials.length) {
      //   task.__meta.inlineInput = true;
      // }

      // if (typeof _with === 'string') {
      //   task.__meta.withString = true;
      // }

      const retVal = {
        name,
        coords,
        action: actionRef,
        size: { x: 211, y: 55 },
        input: {
          ...input,
          ...matchAll(inputPartials.join(' '), REGEX_INLINE_PARAMS),
        },
        with: typeof _with === 'string' ? { items: _with } : _with,
        join,
      };

      return retVal;
    });
  }

  get transitions() {
    const tasks: RawTasks = crawler.getValueByKey(this.tokenSet, 'tasks');

    if(!tasks) {
      return [];
    }

    const transitions = Object.keys(tasks).reduce((arr, name) => {
      if(name === '__meta' || !tasks[name]) {
        return arr;
      }

      const task: RawTask = tasks[name];
      const nextItems: Array<NextItem> = task.next || [];
      const transitions: Array<TransitionInterface> = nextItems
        .reduce(reduceTransitions, [])
        // remove transitions to tasks which don't exist
        // .filter(t => tasks.hasOwnProperty(t.to.name))
        // add the common "from" to all transitions
        .map(t => Object.assign(t, {from: { name } }))
        .map(t => {
          try {
            const { jpath } = getRawTransitionInfo(t, { tasks });
            t.color = crawler.getCommentsForKey(this.tokenSet, jpath.concat('do'));
          }
          catch(e) {
            // pass
          }

          return t;
        })
        ;

      return arr.concat(transitions || []);
    }, []);

    return transitions;
  }

  setInputs(inputs: Array<string>, deletions: Array<string>) {
    const { oldTree } = this.startMutation();
    let oldVal = this.get('input') || [];
    const keys = oldVal.map(val => typeof val === 'string' ? val : Object.keys(val)[0]);
    // remove any deletions from params.
    deletions.forEach(del => {
      const matchingOldVals = oldVal.map((ov, idx) => {
        if(ov === del || typeof ov === 'object' && ov.hasOwnProperty(del)) {
          return idx;
        }
        else {
          return null;
        }
      }).filter(idx => idx != null).reverse();
      //  if already exists in inputs, here, delete from the old val.  we'll add them back later.
      matchingOldVals.forEach(idx => {
        oldVal.splice(+idx, 1);
        keys.splice(+idx, 1);
      });
    });
    inputs = inputs.map(input => keys.indexOf(input) > -1 ? oldVal[keys.indexOf(input)] : input);
    oldVal = oldVal.filter((val, idx) => {
      return !inputs.includes(val);
    });
    // add any new inputs from params.
    oldVal = inputs.concat(oldVal);

    crawler.set(this.tokenSet, [ 'input' ], oldVal);
    this.endMutation(oldTree);
  }

  setVars(vars: Array<Object>) {
    const { oldTree } = this.startMutation();

    if (vars && vars.length) {
      crawler.set(this.tokenSet, [ 'vars' ], vars);
    }
    else {
      crawler.delete(this.tokenSet, [ 'vars' ]);
    }
    this.endMutation(oldTree);
  }

  addTask(task: TaskInterface) {
    const { oldTree } = this.startMutation();
    const { name, coords, ...data } = task;
    const parentKey = [ 'tasks' ];

    if (crawler.getValueByKey(this.tokenSet, parentKey).__meta.keys.length) {
      crawler.set(this.tokenSet, parentKey.concat(name), data);
    }
    else {
      crawler.set(this.tokenSet, parentKey, { [name]: data });
    }

    if(coords) {
      crawler.setCommentForKey(this.tokenSet, parentKey.concat(name), `[${coords.x}, ${coords.y}]`);
    }

    this.endMutation(oldTree);
  }

  updateTransitions(ref: TaskRefInterface, name: string, updateType: string='rename') {
    const tasks = crawler.getValueByKey(this.tokenSet, [ 'tasks' ]);
    Object.keys(tasks).map((taskKey) => {
      const nextElements = _.get(tasks[taskKey], 'next', []);
      nextElements.map((nextElement, elementIndex) => {
        const nextTasks = _.get(nextElement, 'do', []);
        if (typeof nextTasks === 'string') {
          if (nextTasks === ref.name) {
            const transitionPath = [
              'tasks',
              taskKey,
              'next',
              elementIndex,
              'do',
            ];
            switch(updateType) {
              case 'rename':
                crawler.renameMappingKey(this.tokenSet, transitionPath, name);
                break;
              case 'delete':
                crawler.delete(this.tokenSet, transitionPath);
            }
          }
        }
        else {
          nextTasks.map((nextTask, taskIndex) => {
            if (nextTask === ref.name) {
              const transitionPath = [
                'tasks',
                taskKey,
                'next',
                elementIndex,
                'do',
                taskIndex,
              ];

              const lastTask = crawler.getValueByKey(this.tokenSet, transitionPath.slice(0, -1)).length === 1;
              switch(updateType) {
                case 'rename':
                  crawler.renameMappingKey(this.tokenSet, transitionPath, name);
                  break;
                case 'delete':
                  if (lastTask) {
                    crawler.delete(this.tokenSet, transitionPath.slice(0, -1));
                  }
                  else {
                    crawler.delete(this.tokenSet, transitionPath);
                  }
              }
            }
          });
        }
      });
    });
  }

  updateTask(ref: TaskRefInterface, newData: $Shape<TaskInterface>) {
    const { oldTree } = this.startMutation();
    const { name, coords, ...data } = newData;
    const key = [ 'tasks', ref.name ];

    if (name && ref.name !== name) {
      this.updateTransitions(ref, name);
      crawler.renameMappingKey(this.tokenSet, key, name);
      key.splice(-1, 1, name);

    }

    if (coords) {
      let comments = crawler.getCommentsForKey(this.tokenSet, key) || '[0, 0]';
      // crawler.setCommentForKey(this.tokenSet, key, `[${coords.x.toFixed()}, ${coords.y.toFixed()}]`);
      if (!REG_COORDS.test(comments)) {
        comments += '\n[0, 0]';
      }
      crawler.setCommentForKey(this.tokenSet, key, comments.replace(REG_COORDS, `[${coords.x.toFixed()}, ${coords.y.toFixed()}]`));
    }

    Object.keys(data).forEach(k => {
      crawler.set(this.tokenSet, key.concat(k), data[k]);
    });

    this.endMutation(oldTree);
  }

  setTaskProperty(ref: TaskRefInterface, path: JpathKey , value: any) {
    const { oldTree } = this.startMutation();

    crawler.set(this.tokenSet, [ 'tasks', ref.name ].concat(path), value);

    this.endMutation(oldTree);
  }

  deleteTaskProperty(ref: TaskRefInterface, path: JpathKey) {
    const { oldTree } = this.startMutation();
    crawler.deleteMappingItem(this.tokenSet, [ 'tasks', ref.name ].concat(path));

    this.endMutation(oldTree);
  }

  deleteTask(ref: TaskRefInterface) {
    const { oldTree } = this.startMutation();
    this.updateTransitions(ref, ref.name, 'delete');
    crawler.deleteMappingItem(this.tokenSet, [ 'tasks', ref.name ]);

    this.endMutation(oldTree);
  }

  addTransition(transition: TransitionInterface) {
    const { oldTree } = this.startMutation();
    const { from, to } = transition;
    const key = [ 'tasks', from.name, 'next' ];

    const next: NextItem = {
      do: [].concat(to).map(t => t.name),
    };

    if(transition.condition) {
      next.when = transition.condition;
    }

    const existing = crawler.getValueByKey(this.tokenSet, key);
    if(existing) {
      // creates a new array item
      crawler.set(this.tokenSet, key.concat('#'), next);
    }
    else {
      crawler.set(this.tokenSet, key, [ next ]);
    }

    this.endMutation(oldTree);
  }

  updateTransition(oldTransition: TransitionInterface, newData: $Shape<TransitionInterface>) {
    const { oldData, oldTree } = this.startMutation();
    const { nextItem: oldNext, jpath: oldKey, error } = getRawTransitionInfo(oldTransition, oldData);

    if(error) {
      this.emitError(error);
      return;
    }

    const { condition: oldCondition, from: oldFrom } = oldTransition;
    const { publish: newPublish, condition: newCondition, from: newFrom, to: newTo } = newData;
    const newFromName = newFrom && newFrom.name || oldFrom.name;
    const next: NextItem = {};

    if(newData.hasOwnProperty('to')) {
      if(newTo && newTo.length) {
        const names = newTo.map(t => t.name);
        next.do = getDoValue(names, oldNext);
      }
      else {
        // newTo explicitly set to null or empty array, remove the "do" property
        next.do = undefined;
      }
    }

    if(newData.hasOwnProperty('condition')) {
      if(newCondition) {
        next.when = newCondition;
      }
      else if(oldCondition) {
        // newCondition explicitly set to null, remove the old condition
        next.when = undefined;
      }
    }

    if(newData.hasOwnProperty('publish')) {
      next.publish = getPublishValue(newPublish, oldNext);
    }

    const sameFrom = oldFrom.name === newFromName;
    if(sameFrom) {
      // Update the existing "old" object
      Object.keys(next).forEach(k => {
        if(next[k] === null) {
          crawler.deleteMappingItem(this.tokenSet, oldKey.concat(k));
        }
        else {
          crawler.set(this.tokenSet, oldKey.concat(k), next[k]);
        }
      });
    }
    else {
      const newKey = [ 'tasks', newFromName, 'next' ];
      const existing = crawler.getValueByKey(this.tokenSet, newKey);

      if (existing) {
        newKey.push(existing.length);
        crawler.moveTokenValue(this.tokenSet, oldKey, newKey);
        Object.keys(next).forEach(k =>
          crawler.set(this.tokenSet, newKey.concat(k), next[k])
        );
      }
      else {
        crawler.set(this.tokenSet, newKey, [ next ]);
      }
    }

    this.endMutation(oldTree);
  }

  setTransitionProperty(transition: TransitionInterface, path: JpathKey, value: any) {
    const { oldData, oldTree } = this.startMutation();
    const { nextItem, jpath, error } = getRawTransitionInfo(transition, oldData);

    if(error) {
      this.emitError(error);
      return;
    }

    const key = [].concat(jpath).concat(path);

    switch(key[key.length - 1]) {
      case 'do':
        value = getDoValue(value, nextItem);
        break;

      case 'publish':
        value = getPublishValue(value, nextItem);
        break;

      case 'color':
        crawler.setCommentForKey(this.tokenSet, jpath.concat('do'), value.toString());
        this.endMutation(oldTree);
        return;
    }

    if(value === undefined) {
      crawler.deleteMappingItem(this.tokenSet, key);
    }
    else {
      crawler.set(this.tokenSet, key, value);
    }

    this.endMutation(oldTree);
  }

  deleteTransitionProperty(transition: TransitionInterface, path: JpathKey) {
    const { oldData, oldTree } = this.startMutation();
    const { jpath, error } = getRawTransitionInfo(transition, oldData);

    if(error) {
      this.emitError(error);
      return;
    }

    if (path !== 'color') {
      this.endMutation(oldTree);
      return;
    }

    crawler.deleteMappingItem(this.tokenSet, jpath.concat(path));

    this.endMutation(oldTree);
  }

  deleteTransition(transition: TransitionInterface) {
    const { oldData, oldTree } = this.startMutation();
    const key = [ 'tasks', transition.from.name, 'next' ];
    const { nextIndex, error } = getRawTransitionInfo(transition, oldData);

    if(error) {
      this.emitError(error);
      return;
    }

    const transitions = crawler.getValueByKey(this.tokenSet, key);
    if(transitions.length === 1) {
      // If there was only one transition to begin with,
      // we can now delete the "next" property altogether.
      crawler.deleteMappingItem(this.tokenSet, key);
    }
    else {
      // Otherwise, delete the entire "nextItem".
      crawler.spliceCollection(this.tokenSet, key, nextIndex, 1);
    }

    this.endMutation(oldTree);
  }

  getRangeForTask(task: TaskInterface) {
    return crawler.getRangeForKey(this.tokenSet, [ 'tasks', task.name ]);
  }
}

function reduceTransitions(arr: Array<TransitionInterface>, nxt: NextItem): Array<TransitionInterface> {
  if(!nxt) {
    return arr;
  }

  const doArr = doToTaskRefArray(nxt.do);

  if(doArr.length || nxt.when || (nxt.publish && nxt.publish.length)) {
    arr.push({
      from: { name: '' }, // added later
      to: doArr,
      condition: nxt.when || null,
      publish: publishToArray(nxt.publish),
    });
  }

  return arr;
}

function publishToArray(publishItem: ?string | ?Array<Object>): Array<Object> {
  if(publishItem === null || typeof publishItem === 'undefined') {
    return [];
  }

  if(typeof publishItem === 'string') {
    const obj = matchAll(publishItem, REGEX_INLINE_PARAMS);
    return Object.keys(obj).map(k => ({ [k]: obj[k] }));
  }

  return publishItem;
}

function doToTaskRefArray(doItem: ?string | ?Array<string>): Array<TaskRefInterface> {
  if(doItem === null || typeof doItem === 'undefined') {
    return [];
  }

  return (typeof doItem === 'string' ? doItem.split(',') : doItem).map(s => ({ name: s.trim() }));
}

function getRawTransitionInfo(transition: TransitionInterface, rawData: Object): $Shape<NextItemInfo> {
  const { from } = transition;
  const task: RawTask = rawData.tasks[from.name];

  if(!task || !task.next || !task.next.length) {
    return {
      error: new Error(`"${from.name}" task does not contain any transitions`),
    };
  }

  const { nextItem, nextIndex } = getNextItemInfo(transition, task.next);

  if(nextIndex === -1) {
    return {
      error: new Error(`Could not find "next" item for: "${from.name}"`),
    };
  }

  return {
    nextItem,
    nextIndex,
    jpath: [ 'tasks', from.name, 'next', nextIndex ],
  };
}

function getNextItemInfo({ from, to, condition, publish }: TransitionInterface, next: Array<NextItem>): $Shape<NextItemInfo> {
  const nextIndex = next.findIndex(tr => {
    if(to && to.length && diff(doToTaskRefArray(tr.do), to)) {
      return false;
    }

    if(condition && condition !== tr.when) {
      return false;
    }

    return true;
  });

  return { nextIndex, nextItem: next[nextIndex] };
}


function getDoValue(newDo: ?Array<string>, oldNext: NextItem) {
  if(newDo && newDo.length) {
    if(oldNext.do && typeof oldNext.do === 'string') {
      return newDo.join(', ');
    }
    else {
      return newDo;
    }
  }

  // This likely means the value was explicitly set to null/empty and
  // should be be deleted from the tree altogether.
  return undefined;
}

function getPublishValue(newPublish: ?Array<Object>, oldNext: NextItem) {
  if(newPublish && newPublish.length) {
    if(oldNext.publish && typeof oldNext.publish === 'string') {
      return newPublish.reduce((str, obj) => {
        const key = Object.keys(obj)[0];
        return `${str} ${key}=${obj[key]}`;
      }, '').trim();
    }
    else {
      return newPublish;
    }
  }

  // This likely means the value was explicitly set to null/empty and
  // should be be deleted from the tree altogether.
  return undefined;
}

export default OrquestaModel;
