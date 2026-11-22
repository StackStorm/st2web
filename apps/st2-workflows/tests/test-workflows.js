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

import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';

import { Provider } from 'react-redux';
import { render, fireEvent, act } from '@testing-library/react';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import '@stackstorm/module-test-utils/bootstrap/storage';
import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import router from '@stackstorm/module-router/methods';
import globalStore from '@stackstorm/module-store';

import store from '../store';
import Workflows from '../workflows.component';

const API = 'https://example.com/api/v1';

// The canvas places tasks that have no coordinates, which edits (and dirties) the workflow, so
// give every task a position up front.
let column = 0;
const WORKFLOW = fs.readFileSync(path.join(__dirname, '../../../modules/st2flow-model/tests/data/orquesta-basic.yaml'), 'utf-8')
  .replace(/^ {2}(\w+):$/gm, (line) => {
    column += 1;
    return `  # [${column * 250}, 100]\n${line}`;
  });

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

const ACTION = {
  id: 'act1',
  ref: 'examples.basic',
  name: 'basic',
  pack: 'examples',
  runner_type: 'orquesta',
  entry_point: 'workflows/basic.yaml',
  metadata_file: 'actions/basic.meta.yaml',
};

const ACTIONS = [ ACTION, { ref: 'core.local', name: 'local', pack: 'core', parameters: {}}];

const button = (title) => document.querySelector(`[title="${title}"]`);
const notifications = () => store.getState().notifications.map(({ type, message, source }) => [ type, message, source ]);

// Mocked requests settle within one macrotask; let what they cause happen inside act(). This
// keeps the real setTimeout, so it also works while a test fakes the timers.
const { setTimeout: realSetTimeout } = globalThis;
const settle = () => act(() => new Promise(resolve => realSetTimeout(resolve)));

// what the canvas, details and editor do: issue commands to the flow store
async function edit(action) {
  act(() => {
    store.dispatch(action);
  });
  await settle();
}

async function click(element) {
  fireEvent.click(element);
  await settle();
}

describe('workflows designer', () => {
  let mock;

  beforeAll(async () => {
    await api.connect();
  });
  afterAll(() => {
    api.disconnect();
  });

  beforeEach(async () => {
    mock = new MockAdapter(axios);
    mock.onGet(`${API}/actions/views/overview`).reply(200, ACTIONS);
    mock.onGet(`${API}/actions/examples.basic`).reply(200, ACTION);
    mock.onGet(`${API}/packs/views/file/examples/actions/basic.meta.yaml`).reply(200, META);
    mock.onGet(`${API}/packs/views/file/examples/actions/workflows/basic.yaml`).reply(200, WORKFLOW);
    mock.onGet(`${API}/packs`).reply(200, []);

    sinon.stub(notification, 'error');

    // Opening /action/<ref> loads that workflow unless it is the one already loaded. Forget it, so
    // each test starts from the saved files (loading also replaces the notifications). The app's
    // location listener expects a location to exist before anything else is dispatched.
    router.push({ pathname: '/' });
    // Edits less than 250ms apart are one undo step, even across tests; an undo flushes that.
    store.dispatch({ type: 'FLOW_UNDO' });
    store.dispatch({ type: 'LOAD_WORKFLOW', currentWorkflow: 'none.none' });
    router.push({ pathname: '/action/examples.basic' });
    await settle();

    render(
      <Provider store={globalStore}>
        <Workflows routes={[]} />
      </Provider>
    );
    await settle();
  });

  afterEach(() => {
    sinon.restore();
    mock.restore();
  });

  it('loads the workflow and its metadata for the action in the URL', () => {
    const state = store.getState();

    expect(state.currentWorkflow).to.equal('examples.basic');
    expect(state.workflowSource).to.equal(WORKFLOW);
    expect(state.metaSource).to.equal(META);
    expect(state.dirty).to.equal(false);
    expect(state.actions).to.deep.equal(ACTIONS);
    expect(document.querySelector('.canvas')).to.exist;
  });

  it('places the tasks of a workflow saved without positions, without marking it changed', async () => {
    // most workflows are written by hand, with no "# [x, y]" comments for the designer
    const unplaced = WORKFLOW.replace(/^ {2}# \[\d+, \d+\]\n/gm, '');
    expect(unplaced).to.not.match(/# \[/);
    mock.onGet(`${API}/actions/examples.unplaced`).reply(200, { ...ACTION, id: 'act2', ref: 'examples.unplaced', name: 'unplaced', entry_point: 'workflows/unplaced.yaml', metadata_file: 'actions/unplaced.meta.yaml' });
    mock.onGet(`${API}/packs/views/file/examples/actions/unplaced.meta.yaml`).reply(200, META.replace(/basic/g, 'unplaced'));
    mock.onGet(`${API}/packs/views/file/examples/actions/workflows/unplaced.yaml`).reply(200, unplaced);

    act(() => {
      router.push({ pathname: '/action/examples.unplaced' });
    });
    await settle();
    await settle();

    const state = store.getState();
    expect(state.currentWorkflow).to.equal('examples.unplaced');
    expect(state.tasks).to.not.be.empty;
    state.tasks.forEach(({ name, coords }) => {
      expect(coords.x, name).to.be.at.least(0);
      expect(coords.y, name).to.be.at.least(0);
    });
    expect(state.dirty).to.equal(false);
    expect(button('Run workflow')).to.exist;
    expect(document.title).to.match(/^examples\.unplaced - /);

    // and placing them isn't an undo step
    const placed = state.workflowSource;
    await click(button('Undo'));
    expect(store.getState().workflowSource).to.equal(placed);
    expect(store.getState().dirty).to.equal(false);
  });

  it('treats rearranging the tasks as a layout change: saved, but no reason to block Run', async () => {
    await click(button('Rearrange tasks'));

    const state = store.getState();
    expect(state.dirty).to.equal(false);
    expect(state.layoutDirty).to.equal(true);
    state.tasks.forEach(({ name, coords }) => {
      expect(coords.x, name).to.be.at.least(0);
    });
    expect(button('Run workflow')).to.exist;
    expect(document.title).to.match(/^examples\.basic - /);

    // Save writes the new positions and clears it
    mock.onPut(`${API}/actions/examples.basic`).reply(200, {});
    await click(button('Save workflow'));

    const [ put ] = mock.history.put;
    expect(JSON.parse(put.data).data_files[0].content).to.equal(state.workflowSource);
    expect(store.getState().layoutDirty).to.equal(false);
  });

  it('autosaves a layout change but not just opening a workflow', async () => {
    mock.onPut(`${API}/actions/examples.basic`).reply(200, {});
    const clock = sinon.useFakeTimers({ toFake: [ 'setTimeout', 'clearTimeout' ]});
    try {
      act(() => {
        store.dispatch({ type: 'TOGGLE_AUTOSAVE', autosaveEnabled: true });
      });
      // what the canvas does whenever the task list changes, as it does on load
      act(() => {
        router.push({ pathname: '/' });
        store.dispatch({ type: 'LOAD_WORKFLOW', currentWorkflow: 'none.none' });
        router.push({ pathname: '/action/examples.basic' });
      });
      await settle();
      act(() => {
        clock.tick(1500);
      });
      await settle();
      expect(mock.history.put).to.have.length(0);

      await click(button('Rearrange tasks'));
      act(() => {
        clock.tick(1500);
      });
      await settle();
      expect(mock.history.put).to.have.length(1);
    }
    finally {
      act(() => {
        store.dispatch({ type: 'TOGGLE_AUTOSAVE', autosaveEnabled: false });
      });
      clock.restore();
    }
  });

  it('saves an existing action with PUT, including both files', async () => {
    mock.onPut(`${API}/actions/examples.basic`).reply(200, {});
    await edit({ type: 'MODEL_ISSUE_COMMAND', command: 'addTask', args: [{ name: 'task1', action: 'core.noop' }]});
    expect(store.getState().dirty).to.equal(true);
    const { workflowSource, metaSource } = store.getState();

    await click(button('Save workflow'));

    expect(mock.history.put).to.have.length(1);
    const body = JSON.parse(mock.history.put[0].data);
    expect(body).to.include({
      name: 'basic',
      pack: 'examples',
      entry_point: 'workflows/basic.yaml',
      metadata_file: 'actions/basic.meta.yaml',
    });
    expect(body.parameters).to.deep.equal({ which: { type: 'string', required: true }});
    expect(body.data_files).to.deep.equal([
      { file_path: 'workflows/basic.yaml', content: workflowSource },
      { file_path: 'basic.meta.yaml', content: metaSource },
    ]);
    expect(workflowSource).to.contain('task1:');

    expect(store.getState().dirty).to.equal(false);
    expect(notifications()).to.deep.include([ 'success', 'Workflow saved.', undefined ]);
    expect(mock.history.post).to.have.length(0);
  });

  it('creates a new action with POST and refreshes the action list', async () => {
    mock.onPost(`${API}/actions`).reply(201, {});
    await edit({ type: 'META_ISSUE_COMMAND', command: 'set', args: [ 'name', 'copy' ]});
    const requestsBefore = mock.history.get.length;

    await click(button('Save workflow'));

    expect(mock.history.put).to.have.length(0);
    const body = JSON.parse(mock.history.post[0].data);
    expect(body).to.include({ name: 'copy', pack: 'examples', metadata_file: 'actions/copy.meta.yaml' });
    expect(body.data_files.map(({ file_path }) => file_path)).to.deep.equal([ 'workflows/basic.yaml', 'copy.meta.yaml' ]);
    expect(mock.history.get.slice(requestsBefore).map(({ url }) => url)).to.include(`${API}/actions/views/overview`);
    expect(store.getState().dirty).to.equal(false);
  });

  it('reports why a save failed and stays dirty', async () => {
    mock.onPut(`${API}/actions/examples.basic`).reply(400, { faultstring: 'entry point is invalid' });
    await edit({ type: 'MODEL_ISSUE_COMMAND', command: 'addTask', args: [{ name: 'task1', action: 'core.noop' }]});

    await click(button('Save workflow'));

    expect(store.getState().dirty).to.equal(true);
    expect(notifications()).to.deep.include.members([
      [ 'error', 'Error saving workflow.', undefined ],
      [ 'error', 'Error saving workflow.: entry point is invalid', 'icon-save' ],
    ]);
  });

  it('does not save a workflow without a name', async () => {
    await edit({ type: 'META_ISSUE_COMMAND', command: 'set', args: [ 'name', '' ]});

    await click(button('Save workflow'));

    expect(mock.history.put).to.have.length(0);
    expect(mock.history.post).to.have.length(0);
    expect(notifications()).to.deep.include([ 'error', 'Error saving workflow.: You must provide a name of the workflow.', 'icon-save' ]);
  });

  it('undoes and redoes from the toolbar', async () => {
    // Edits within 250ms of the last one (the canvas lays the workflow out when it opens) merge
    // into one undo step. That window is a lodash debounce on a real timer, so it has to pass for
    // real: faking the clock alone leaves the timer pending.
    await act(() => new Promise(resolve => setTimeout(resolve, 300)));

    await edit({ type: 'MODEL_ISSUE_COMMAND', command: 'addTask', args: [{ name: 'task1', action: 'core.noop', coords: { x: 0, y: 300 }}]});
    const edited = store.getState().workflowSource;

    await click(button('Undo'));
    expect(store.getState().workflowSource).to.equal(WORKFLOW);

    await click(button('Redo'));
    expect(store.getState().workflowSource).to.equal(edited);
  });

  it('cannot be run with unsaved changes', async () => {
    expect(button('Run workflow')).to.exist;

    await edit({ type: 'MODEL_ISSUE_COMMAND', command: 'addTask', args: [{ name: 'task1', action: 'core.noop' }]});

    expect(button('Run workflow')).to.be.null;
    await click(button('Cannot run with unsaved changes'));
    expect(document.body.textContent).to.not.contain('Execute Workflow');
  });

  it('names the workflow in the page title and marks unsaved changes', async () => {
    expect(document.title).to.match(/^examples\.basic - Workflow Designer \| /);

    await edit({ type: 'MODEL_ISSUE_COMMAND', command: 'addTask', args: [{ name: 'task1', action: 'core.noop' }]});

    expect(document.title).to.match(/^\* examples\.basic - Workflow Designer \| /);
  });

  describe('running', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers({ toFake: [ 'setTimeout', 'clearTimeout' ]});
    });
    afterEach(() => {
      clock.restore();
    });

    it('executes the workflow with the form values and polls until it finishes', async () => {
      mock.onPost(`${API}/executions`).reply(201, {
        id: 'ex1',
        web_url: 'https://example.com/#/history/ex1/general',
        liveaction: { action: 'examples.basic' },
      });
      mock.onGet(/\/executions\?id=ex1$/).replyOnce(200, [{
        status: 'running',
        web_url: 'https://example.com/#/history/ex1/general',
        liveaction: { action: 'examples.basic' },
      }])
        .onGet(/\/executions\?id=ex1$/).replyOnce(200, [{
          status: 'succeeded',
          elapsed_seconds: 3,
          web_url: 'https://example.com/#/history/ex1/general',
          liveaction: { action: 'examples.basic' },
        }]);

      fireEvent.click(button('Run workflow'));
      expect(document.body.textContent).to.contain('Run workflow with inputs');

      // "which" is required and has no default
      const execute = [ ...document.querySelectorAll('input') ].find(({ value }) => value === 'Execute Workflow');
      expect(execute.disabled).to.be.true;
      fireEvent.change(document.querySelector('[data-test="field:which"]'), { target: { value: 'a' }});
      expect(execute.disabled).to.be.false;

      fireEvent.click(execute);
      await settle();

      expect(JSON.parse(mock.history.post[0].data)).to.deep.equal({
        action: 'examples.basic',
        action_is_workflow: true,
        parameters: { which: 'a' },
      });
      expect(notifications()).to.deep.include([ 'success', 'Workflow examples.basic submitted for execution. Details at ', undefined ]);
      expect(store.getState().notifications.at(-1).link).to.equal('/#/history/ex1/general');

      await act(() => clock.tickAsync(5000));
      await settle();
      await act(() => clock.tickAsync(5000));
      await settle();

      const polls = mock.history.get.filter(({ url }) => url.includes('/executions?id=ex1'));
      expect(polls).to.have.length(2);
      expect(notifications()).to.deep.include([ 'success', 'Workflow examples.basic succeeded in 3s. Details at ', undefined ]);
    });

    it('reports a failed submission', async () => {
      mock.onPost(`${API}/executions`).reply(400, { faultstring: 'which is required' });

      fireEvent.click(button('Run workflow'));
      fireEvent.change(document.querySelector('[data-test="field:which"]'), { target: { value: 'a' }});
      const execute = [ ...document.querySelectorAll('input') ].find(({ value }) => value === 'Execute Workflow');
      // run() rethrows the error to the button's onClick, which drops the promise; keep that
      // rejection from failing the run while this test is the only thing going on.
      const listeners = process.listeners('unhandledRejection');
      process.removeAllListeners('unhandledRejection');
      process.on('unhandledRejection', () => {});
      try {
        fireEvent.click(execute);
        await settle();
        await act(() => clock.tickAsync(0));
      }
      finally {
        process.removeAllListeners('unhandledRejection');
        listeners.forEach(listener => process.on('unhandledRejection', listener));
      }

      expect(notifications()).to.deep.include([ 'error', 'Submitting workflow basic failed: which is required', undefined ]);
    });
  });
});
