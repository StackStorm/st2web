// Copyright 2026 The StackStorm Authors.
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

import { describe, it, beforeEach, afterEach, rs } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';

const WORKFLOW = fs.readFileSync(path.join(__dirname, '../../../modules/st2flow-model/tests/data/orquesta-basic.yaml'), 'utf-8');

const META = `---
name: basic
pack: examples
description: Takes a path
runner_type: orquesta
entry_point: workflows/basic.yaml
enabled: true
parameters:
  which:
    type: string
    required: true
`;

const taskNames = () => store.getState().tasks.map(({ name }) => name);
const edges = () => store.getState().transitions
  .map(({ from, to }) => to.map(({ name }) => `${from.name}->${name}`))
  .flat();
const errors = (source) => store.getState().notifications
  .filter(n => n.source === source)
  .map(({ message }) => message);

const command = (name, ...args) => store.dispatch({ type: 'MODEL_ISSUE_COMMAND', command: name, args });
const metaCommand = (name, ...args) => store.dispatch({ type: 'META_ISSUE_COMMAND', command: name, args });
const load = (workflowSource = WORKFLOW, metaSource = META) => store.dispatch({
  type: 'LOAD_WORKFLOW',
  currentWorkflow: 'examples.basic',
  status: 'success',
  payload: { workflowSource, metaSource },
});

let store;

describe('workflows store', () => {
  // The store keeps its models and undo history in module scope, so every test gets a fresh copy.
  beforeEach(async () => {
    rs.resetModules();
    store = (await import('../store')).default;
  });

  describe('initial state', () => {
    it('starts with an empty, clean orquesta workflow', () => {
      const state = store.getState();

      expect(state.workflowSource).to.equal('version: 1.0\ntasks: {}\n');
      expect(state.meta.runner_type).to.equal('orquesta');
      expect(state.pack).to.equal('default');
      expect(state.dirty).to.equal(false);
      expect(state.nextTask).to.equal('task1');
    });
  });

  describe('LOAD_WORKFLOW', () => {
    it('only records the workflow being loaded while the request is pending', () => {
      store.dispatch({ type: 'LOAD_WORKFLOW', currentWorkflow: 'examples.basic' });

      const state = store.getState();
      expect(state.currentWorkflow).to.equal('examples.basic');
      expect(state.pack).to.equal('examples');
      expect(state.tasks).to.deep.equal([]);
    });

    it('parses the workflow and its metadata once loaded', async () => {
      await store.dispatch({
        type: 'LOAD_WORKFLOW',
        currentWorkflow: 'examples.basic',
        promise: Promise.resolve({ workflowSource: WORKFLOW, metaSource: META }),
      });

      const state = store.getState();
      expect(state.workflowSource).to.equal(WORKFLOW);
      expect(state.metaSource).to.equal(META);
      expect(state.meta).to.include({ name: 'basic', pack: 'examples', entry_point: 'workflows/basic.yaml' });
      expect(taskNames()).to.deep.equal([ 't1', 'a', 'b', 'c', 'foobar' ]);
      expect(edges()).to.have.members([ 't1->a', 't1->b', 't1->b', 't1->c', 'b->foobar' ]);
      expect(state.input).to.deep.equal([ 'which' ]);
      expect(Object.keys(state.ranges)).to.deep.equal([ 't1', 'a', 'b', 'c', 'foobar' ]);
      expect(state.notifications).to.deep.equal([]);
      expect(state.dirty).to.equal(false);
    });

    it('keeps the current workflow when loading fails', async () => {
      load();

      await store.dispatch({
        type: 'LOAD_WORKFLOW',
        currentWorkflow: 'examples.other',
        promise: Promise.reject(new Error('404')),
      });

      expect(store.getState().currentWorkflow).to.equal('examples.other');
      expect(taskNames()).to.have.length(5);
    });

    it('numbers new tasks after the highest taskN', () => {
      load('version: 1.0\ntasks:\n  task2:\n    action: core.noop\n  task7:\n    action: core.noop\n');

      expect(store.getState().nextTask).to.equal('task8');
    });

    it('switches the model to the runner type of the loaded metadata', () => {
      load('version: \'2.0\'\nmain:\n  tasks:\n    one:\n      action: core.noop\n', META.replace('orquesta', 'mistral-v2'));

      expect(taskNames()).to.deep.equal([ 'one' ]);
      expect(store.getState().meta.runner_type).to.equal('mistral-v2');
    });
  });

  describe('MODEL_ISSUE_COMMAND', () => {
    beforeEach(() => {
      load();
    });

    it('adds a task where it was dropped and marks the workflow dirty', () => {
      command('addTask', { name: 'task1', action: 'core.noop', coords: { x: 100, y: 200 }});

      const state = store.getState();
      const task = state.tasks.find(({ name }) => name === 'task1');
      expect(task.action).to.equal('core.noop');
      expect(task.coords).to.deep.equal({ x: 100, y: 200 });
      expect(state.workflowSource).to.match(/# \[100, 200\]\n\s+task1:\n\s+action: core\.noop\n$/);
      expect(state.nextTask).to.equal('task2');
      expect(state.dirty).to.equal(true);
    });

    it('moves a task by updating its coordinates, which is only a layout change', () => {
      command('updateTask', { name: 'a' }, { coords: { x: 40.4, y: 60.6 }});

      const state = store.getState();
      expect(state.tasks.find(({ name }) => name === 'a').coords).to.deep.equal({ x: 40, y: 61 });
      expect(state.workflowSource).to.contain('# [40, 61]');
      expect(state.dirty).to.equal(false);
      expect(state.layoutDirty).to.equal(true);
    });

    it('counts a move together with another change as a change', () => {
      command('updateTask', { name: 'a' }, { coords: { x: 1, y: 2 }, action: 'core.local' });

      expect(store.getState().dirty).to.equal(true);
    });

    it('lays out every task on Rearrange, as a layout change', () => {
      store.dispatch({ type: 'MODEL_LAYOUT' });

      const state = store.getState();
      expect(state.dirty).to.equal(false);
      expect(state.layoutDirty).to.equal(true);
    });

    it('renames a task and the transitions that point to it', () => {
      command('updateTask', { name: 'a' }, { name: 'first' });

      expect(taskNames()).to.include('first').and.not.include('a');
      expect(edges()).to.include('t1->first').and.not.include('t1->a');
    });

    it('deletes a task together with the transitions to it', () => {
      command('deleteTask', { name: 'foobar' });

      expect(taskNames()).to.deep.equal([ 't1', 'a', 'b', 'c' ]);
      expect(edges()).to.not.include('b->foobar');
      expect(store.getState().workflowSource).to.not.contain('foobar');
    });

    it('adds a transition with a condition', () => {
      command('addTransition', { from: { name: 'a' }, to: [{ name: 'c' }], condition: '<% succeeded() %>' });

      const added = store.getState().transitions.find(({ from }) => from.name === 'a');
      expect(added.to).to.deep.equal([{ name: 'c' }]);
      expect(added.condition).to.equal('<% succeeded() %>');
    });

    it('deletes a transition', () => {
      const transition = store.getState().transitions.find(({ from }) => from.name === 'b');

      command('deleteTransition', transition);

      expect(edges()).to.not.include('b->foobar');
      expect(taskNames()).to.include('foobar');
    });

    it('ignores commands the model does not have', () => {
      const before = store.getState();

      command('explode');

      expect(store.getState().workflowSource).to.equal(before.workflowSource);
      expect(store.getState().dirty).to.equal(false);
    });

    it('reports schema errors of the workflow as notifications until they are fixed', () => {
      command('setTaskProperty', { name: 'a' }, [ 'bogus' ], 1);

      expect(store.getState().notifications.map(({ type, source }) => [ type, source ])).to.deep.equal([[ 'error', 'workflow' ]]);
      expect(errors('workflow')).to.deep.equal([ 'tasks.a - must NOT have additional properties ("bogus")' ]);

      command('deleteTaskProperty', { name: 'a' }, [ 'bogus' ]);

      expect(errors('workflow')).to.deep.equal([]);
    });
  });

  describe('input validation of editor changes', () => {
    beforeEach(() => {
      load();
    });

    it('requires every parameter in the workflow input', () => {
      command('applyDelta', null, WORKFLOW.replace('  - which\n', '  - other: 1\n'));

      expect(errors('input')).to.deep.equal([ 'Parameter "which" must be in input' ]);
    });

    it('requires a value for inputs that are not parameters', () => {
      command('applyDelta', null, WORKFLOW.replace('  - which\n', '  - which\n  - extra\n  - given: 2\n'));

      expect(errors('input')).to.deep.equal([ 'Extra input "extra" must have a value' ]);
    });

    it('clears the input errors once the input is fixed', () => {
      command('applyDelta', null, WORKFLOW.replace('  - which\n', '  - extra\n'));
      expect(errors('input')).to.have.length(2);

      command('applyDelta', null, WORKFLOW);
      expect(errors('input')).to.deep.equal([]);
    });

    it('does not validate input for other commands', () => {
      command('applyDelta', null, WORKFLOW.replace('  - which\n', '  - extra\n'));
      command('addTask', { name: 'task1', action: 'core.noop' });

      expect(errors('input')).to.deep.equal([]);
    });
  });

  describe('META_ISSUE_COMMAND', () => {
    beforeEach(() => {
      load();
    });

    it('updates the metadata and marks the workflow dirty', () => {
      metaCommand('set', 'description', 'Picks a path');

      const state = store.getState();
      expect(state.meta.description).to.equal('Picks a path');
      expect(state.metaSource).to.contain('description: Picks a path');
      expect(state.dirty).to.equal(true);
    });

    it('keeps the workflow input in step with the parameters', () => {
      metaCommand('set', 'parameters', { which: { type: 'string' }, count: { type: 'integer' }});

      expect(store.getState().input).to.deep.equal([ 'which', 'count' ]);
      expect(store.getState().workflowSource).to.match(/input:\n\s+- which\n\s+- count\n/);

      metaCommand('set', 'parameters', { count: { type: 'integer' }});

      expect(store.getState().input).to.deep.equal([ 'count' ]);
    });

    it('refuses to change the runner type of a workflow with tasks', () => {
      expect(() => metaCommand('set', 'runner_type', 'mistral-v2'))
        .to.throw('Cannot change runner_type of workflow that has existing tasks');
    });

    it('swaps to an empty workflow of the new runner type when there are no tasks', () => {
      load('version: 1.0\ntasks: {}\n');

      metaCommand('set', 'runner_type', 'mistral-v2');

      expect(store.getState().workflowSource).to.equal('version: \'2.0\'\nmain:\n  tasks: {}\n');
      expect(store.getState().meta.runner_type).to.equal('mistral-v2');
    });
  });

  describe('undo and redo', () => {
    let clock;

    // edits closer together than 250ms are one undo step
    beforeEach(() => {
      clock = sinon.useFakeTimers();
      load();
    });
    afterEach(() => clock.restore());

    const step = (fn) => {
      fn();
      clock.tick(300);
    };

    it('undoes and redoes workflow edits one step at a time', () => {
      step(() => command('addTask', { name: 'task1', action: 'core.noop' }));
      const withOne = store.getState().workflowSource;
      step(() => command('addTask', { name: 'task2', action: 'core.noop' }));

      store.dispatch({ type: 'FLOW_UNDO' });
      expect(store.getState().workflowSource).to.equal(withOne);
      expect(taskNames()).to.not.include('task2');

      store.dispatch({ type: 'FLOW_UNDO' });
      expect(store.getState().workflowSource).to.equal(WORKFLOW);
      expect(taskNames()).to.deep.equal([ 't1', 'a', 'b', 'c', 'foobar' ]);

      store.dispatch({ type: 'FLOW_REDO' });
      store.dispatch({ type: 'FLOW_REDO' });
      expect(taskNames()).to.include.members([ 'task1', 'task2' ]);
    });

    it('treats a burst of edits as one step', () => {
      command('addTask', { name: 'task1', action: 'core.noop' });
      clock.tick(100);
      command('updateTask', { name: 'task1' }, { coords: { x: 5, y: 5 }});

      store.dispatch({ type: 'FLOW_UNDO' });

      expect(store.getState().workflowSource).to.equal(WORKFLOW);
    });

    it('undoes metadata edits', () => {
      step(() => metaCommand('set', 'description', 'Picks a path'));

      store.dispatch({ type: 'FLOW_UNDO' });

      expect(store.getState().metaSource).to.equal(META);
      expect(store.getState().meta.description).to.equal('Takes a path');
    });

    it('does nothing with no history', () => {
      store.dispatch({ type: 'FLOW_UNDO' });
      store.dispatch({ type: 'FLOW_REDO' });

      expect(store.getState().workflowSource).to.equal(WORKFLOW);
    });
  });

  describe('saving and notifications', () => {
    beforeEach(() => {
      load();
    });

    it('is clean again once a save succeeds, and stays dirty when it fails', async () => {
      command('addTask', { name: 'task1', action: 'core.noop' });

      await store.dispatch({ type: 'SAVE_WORKFLOW', promise: Promise.reject(new Error('nope')) });
      expect(store.getState().dirty).to.equal(true);

      await store.dispatch({ type: 'SAVE_WORKFLOW', promise: Promise.resolve({}) });
      expect(store.getState().dirty).to.equal(false);
    });

    it('keeps one notification per source', () => {
      store.dispatch({ type: 'PUSH_ERROR', source: 'icon-save', error: 'Error saving workflow' });
      store.dispatch({ type: 'PUSH_WARNING', source: 'other', message: 'Careful' });
      store.dispatch({ type: 'PUSH_SUCCESS', source: 'icon-save', message: 'Workflow saved.' });

      expect(store.getState().notifications.map(({ type, source, message }) => [ type, source, message ])).to.deep.equal([
        [ 'warning', 'other', 'Careful' ],
        [ 'success', 'icon-save', 'Workflow saved.' ],
      ]);
    });

    it('keeps every notification without a source', () => {
      store.dispatch({ type: 'PUSH_ERROR', error: 'one' });
      store.dispatch({ type: 'PUSH_ERROR', error: 'two', link: '/history/1' });

      expect(store.getState().notifications.map(({ message, link }) => [ message, link ])).to.deep.equal([
        [ 'one', undefined ],
        [ 'two', '/history/1' ],
      ]);
    });
  });

  describe('ui state', () => {
    it('toggles panels, merges navigation and stores actions and the autosave flag', async () => {
      store.dispatch({ type: 'PANEL_TOGGLE_COLLAPSE', name: 'palette' });
      expect(store.getState().panels).to.deep.equal({ palette: true });
      store.dispatch({ type: 'PANEL_TOGGLE_COLLAPSE', name: 'palette' });
      expect(store.getState().panels).to.deep.equal({ palette: false });

      store.dispatch({ type: 'CHANGE_NAVIGATION', navigation: { task: 't1' }});
      store.dispatch({ type: 'CHANGE_NAVIGATION', navigation: { toTasks: [ 'a' ] }});
      expect(store.getState().navigation).to.deep.equal({ task: 't1', toTasks: [ 'a' ]});

      const actions = [{ ref: 'core.local' }];
      await store.dispatch({ type: 'FETCH_ACTIONS', promise: Promise.resolve(actions) });
      expect(store.getState().actions).to.equal(actions);
      await store.dispatch({ type: 'FETCH_ACTIONS', promise: Promise.reject(new Error('x')) });
      expect(store.getState().actions).to.equal(actions);

      store.dispatch({ type: 'TOGGLE_AUTOSAVE', autosaveEnabled: true });
      expect(store.getState().autosaveEnabled).to.equal(true);

      store.dispatch({ type: 'SET_PACK', pack: 'mine' });
      expect(store.getState().pack).to.equal('mine');
    });
  });
});
