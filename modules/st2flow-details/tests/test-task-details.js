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

import { describe, it } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';

import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { render, fireEvent, within } from '@testing-library/react';

import { OrquestaModel, MistralModel } from '@stackstorm/st2flow-model';

import TaskDetails from '../task-details';

import style from '../style.module.css';

const ORQUESTA = `version: 1.0
tasks:
  t1:
    action: core.local
    input:
      cmd: echo hi
    next:
      - when: <% succeeded() %>
        do:
          - t2
      - when: <% failed() %>
        do: t3
  t2:
    action: core.noop
  t3:
    action: missing.action
`;

const MISTRAL = `version: '2.0'
wf:
  type: direct
  tasks:
    t1:
      action: core.local
`;

const ACTIONS = [{
  ref: 'core.local',
  pack: 'core',
  parameters: {
    cmd: { type: 'string', required: true },
    count: { type: 'integer' },
  },
}, {
  ref: 'core.noop',
  pack: 'core',
  parameters: {},
}];

// A store that records what the panel dispatches.
function renderDetails({ yaml = ORQUESTA, Model = OrquestaModel, runner_type = 'orquesta', navigation = {}, selected = 't1' } = {}) {
  const model = new Model(yaml);
  const actions = [];
  const store = createStore((state = {
    flow: {
      actions: ACTIONS,
      navigation,
      tasks: model.tasks,
      transitions: model.transitions,
      meta: { runner_type },
    },
  }, action) => {
    if (!action.type.startsWith('@@')) {
      actions.push(action);
    }
    return state;
  });
  const onBack = sinon.spy();

  return {
    ...render(
      <Provider store={store}>
        <TaskDetails selected={selected} onBack={onBack} />
      </Provider>
    ),
    actions,
    onBack,
  };
}

const modelCommands = actions => actions
  .filter(a => a.type === 'MODEL_ISSUE_COMMAND')
  .map(({ command, args }) => [ command, ...args ]);

const navigations = actions => actions
  .filter(a => a.type === 'CHANGE_NAVIGATION')
  .map(a => a.navigation);

// the names of the properties a properties panel lists (a property's first line is its name)
const propertyNames = container => Array.from(container.querySelectorAll(`.${style.property}`))
  .map(p => p.firstElementChild.textContent);

describe('st2flow-details TaskDetails', () => {
  it('renders nothing for a task that does not exist', () => {
    const { container } = renderDetails({ selected: 'nope' });

    expect(container.innerHTML).to.equal('');
  });

  it('shows the selected task and goes back to the list', () => {
    const { container, onBack } = renderDetails();

    const task = container.querySelector(`.${style.task}`);
    expect(within(task).getByText('t1')).to.exist;
    expect(within(task).getByText('core.local')).to.exist;

    fireEvent.click(container.querySelector('.icon-chevron_left'));
    expect(onBack.calledOnce).to.be.true;
  });

  it('switches between input, properties and transitions', () => {
    const { getByText, actions } = renderDetails();

    fireEvent.click(getByText('Properties'));
    fireEvent.click(getByText('Transitions'));
    fireEvent.click(getByText('Input'));

    expect(navigations(actions)).to.deep.equal([
      { section: 'properties' },
      { section: 'transitions' },
      { section: 'input' },
    ]);
  });

  describe('input section', () => {
    it('edits the action parameters as the task input', () => {
      const { container, actions } = renderDetails();

      const cmd = container.querySelector('[data-test="field:cmd"]');
      expect(cmd.value).to.equal('echo hi');

      fireEvent.change(container.querySelector('[data-test="field:count"]'), { target: { value: '5' } });
      fireEvent.change(cmd, { target: { value: 'echo bye' } });

      expect(modelCommands(actions)).to.deep.equal([
        [ 'updateTask', { name: 't1' }, { input: { cmd: 'echo hi', count: 5 }}],
        [ 'updateTask', { name: 't1' }, { input: { cmd: 'echo bye' }}],
      ]);
    });

    it('warns when the task action is not installed', () => {
      const { getByText, container } = renderDetails({ selected: 't3' });

      expect(getByText('Couldn\'t find action. Is the pack installed?')).to.exist;
      expect(container.querySelectorAll('.st2-auto-form__field')).to.have.length(0);
    });
  });

  describe('renaming', () => {
    const nameField = container => container.querySelector(`.${style.input} textarea`);

    it('renames the task and follows it', () => {
      const { container, getByDisplayValue, actions } = renderDetails();

      fireEvent.click(getByDisplayValue('Edit'));
      expect(nameField(container).value).to.equal('t1');

      fireEvent.change(nameField(container), { target: { value: 'first' } });
      fireEvent.click(getByDisplayValue('Rename'));

      expect(modelCommands(actions)).to.deep.equal([[ 'updateTask', { name: 't1' }, { name: 'first' }]]);
      expect(navigations(actions)).to.deep.equal([{ toTasks: undefined, task: 'first' }]);
      expect(nameField(container)).to.equal(null);
    });

    it('starts on a double click of the task, and refuses names already in use', () => {
      const { container, getByDisplayValue } = renderDetails();

      fireEvent.doubleClick(container.querySelector(`.${style.task}`));

      // the current name counts as taken too
      expect(getByDisplayValue('Rename').disabled).to.be.true;

      fireEvent.change(nameField(container), { target: { value: 't2' } });
      expect(getByDisplayValue('Rename').disabled).to.be.true;

      fireEvent.change(nameField(container), { target: { value: 't4' } });
      expect(getByDisplayValue('Rename').disabled).to.be.false;
    });

    it('cancels without a change and forgets the typed name', () => {
      const { container, getByDisplayValue, queryByDisplayValue, actions } = renderDetails();

      fireEvent.click(getByDisplayValue('Edit'));
      fireEvent.change(nameField(container), { target: { value: 'first' } });
      fireEvent.click(getByDisplayValue('Cancel'));

      expect(queryByDisplayValue('Rename')).to.equal(null);
      expect(actions).to.deep.equal([]);

      fireEvent.click(getByDisplayValue('Edit'));
      expect(nameField(container).value).to.equal('t1');
    });
  });

  describe('properties section', () => {
    it('uses the Orquesta properties for an orquesta workflow', () => {
      const { container } = renderDetails({ navigation: { section: 'properties' } });

      expect(propertyNames(container)).to.deep.equal([ 'Join', 'With Items', 'Delay', 'Retry' ]);
    });

    it('uses the Mistral properties for a mistral workflow', () => {
      const { container } = renderDetails({
        yaml: MISTRAL,
        Model: MistralModel,
        runner_type: 'mistral-v2',
        navigation: { section: 'properties' },
      });

      expect(propertyNames(container)).to.include.members([ 'Join', 'With Items', 'Concurrency', 'Timeout', 'Publish' ]);
    });

    it('shows no properties for other runners', () => {
      const { container } = renderDetails({ runner_type: 'python-script', navigation: { section: 'properties' } });

      expect(propertyNames(container)).to.deep.equal([]);
    });
  });

  describe('transitions section', () => {
    it('shows an editor per transition out of the task, offering every task as a target', () => {
      const { container } = renderDetails({ navigation: { section: 'transitions' } });

      const transitions = container.querySelectorAll(`.${style.transition}`);
      expect(transitions).to.have.length(2);

      const targets = Array.from(transitions).map(t => t.querySelector('select').value);
      expect(targets).to.deep.equal([ 't2', 't3' ]);

      const options = Array.from(transitions[0].querySelector('select').options).map(o => o.value);
      expect(options).to.deep.equal([ 't1', 't2', 't3' ]);
    });

    it('shows only the hint for a task with no transitions', () => {
      const { container, getByText } = renderDetails({ navigation: { section: 'transitions' }, selected: 't2' });

      expect(container.querySelectorAll(`.${style.transition}`)).to.have.length(0);
      expect(getByText(/To add a transition, hover over a task box/)).to.exist;
    });
  });
});
