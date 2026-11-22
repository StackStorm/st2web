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

import { describe, it, beforeEach } from '@rstest/core';
import { expect } from 'chai';

import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { render, fireEvent } from '@testing-library/react';

import { MistralModel } from '@stackstorm/st2flow-model';

import MistralProperties from '../mistral-properties';
import MistralTransition from '../mistral-transition';

import style from '../style.module.css';

const WORKFLOW = `version: '2.0'
wf:
  type: direct
  tasks:
    plain:
      action: core.noop
      on-success:
        - full: <% $.ok %>
      on-error:
        - counted
    full:
      action: core.noop
      join: all
      with-items: x in <% $.xs %>
      concurrency: 2
      pause-before: true
      wait-before: 5
      wait-after: 10
      timeout: 60
      retry:
        count: 3
        delay: 1
        continue-on: <% $.go %>
      publish:
        out: <% task(full).result %>
      publish-on-error:
        err: <% task(full).result %>
    counted:
      action: core.noop
      join: 2
`;

const TASK_NAMES = [ 'plain', 'full', 'counted' ];

const PROPERTIES = [ 'Join', 'With Items', 'Concurrency', 'Pause Before', 'Wait Before', 'Wait After', 'Timeout', 'Retry', 'Publish', 'Publish On Error' ];

// Renders `element` with a store that records the commands it dispatches.
function renderWithStore(element) {
  const commands = [];
  const store = createStore((state = { flow: {}}, action) => {
    if (action.type === 'MODEL_ISSUE_COMMAND') {
      commands.push([ action.command, ...action.args ]);
    }
    return state;
  });

  return { ...render(<Provider store={store}>{ element }</Provider>), commands };
}

// a property of a properties panel, by the name on its first line
const property = (container, name) => Array.from(container.querySelectorAll(`.${style.property}`))
  .find(p => p.firstElementChild.textContent === name);

const toggle = (container, name) => property(container, name).querySelector('.st2-forms__switch input');

// the input of the auto-form field titled `name` inside `parent`
const field = (parent, name) => {
  const title = Array.from(parent.querySelectorAll('.st2-auto-form__title'))
    .find(t => t.textContent === name);
  return title.closest('label').querySelector('textarea, input, select');
};

// the value field of a property that only has one
const valueField = (container, name) => property(container, name).querySelector('textarea');

describe('st2flow-details Mistral', () => {
  let model;
  let tasks;

  beforeEach(() => {
    model = new MistralModel(WORKFLOW);
    tasks = Object.fromEntries(model.tasks.map(t => [ t.name, t ]));
  });

  describe('MistralProperties', () => {
    const renderProperties = task => renderWithStore(<MistralProperties task={task} />);

    it('reflects which properties the task has', () => {
      const plain = renderProperties(tasks.plain);
      expect(PROPERTIES.map(n => toggle(plain.container, n).checked)).to.deep.equal(PROPERTIES.map(() => false));
      plain.unmount();

      const full = renderProperties(tasks.full);
      expect(PROPERTIES.map(n => toggle(full.container, n).checked)).to.deep.equal(PROPERTIES.map(() => true));
      expect(valueField(full.container, 'With Items').value).to.equal('x in <% $.xs %>');
      expect(valueField(full.container, 'Concurrency').value).to.equal('2');
      expect(valueField(full.container, 'Pause Before').value).to.equal('true');
      expect(valueField(full.container, 'Wait Before').value).to.equal('5');
      expect(valueField(full.container, 'Wait After').value).to.equal('10');
      expect(valueField(full.container, 'Timeout').value).to.equal('60');
      expect(JSON.parse(valueField(full.container, 'Publish').value)).to.deep.equal({ out: '<% task(full).result %>' });
    });

    it('turns properties on with a starting value', () => {
      const { container, commands } = renderProperties(tasks.plain);

      // Timeout is left out: see the report on its zero default
      PROPERTIES.filter(n => n !== 'Timeout').forEach(name => fireEvent.click(toggle(container, name)));

      expect(commands).to.deep.equal([
        [ 'setTaskProperty', tasks.plain, 'join', 'all' ],
        [ 'setTaskProperty', tasks.plain, 'with-items', 'x in <% ctx(y) %>' ],
        [ 'setTaskProperty', tasks.plain, 'concurrency', 1 ],
        [ 'setTaskProperty', tasks.plain, 'pause-before', true ],
        [ 'setTaskProperty', tasks.plain, 'wait-before', true ],
        [ 'setTaskProperty', tasks.plain, 'wait-after', true ],
        [ 'setTaskProperty', tasks.plain, 'retry', { count: 1, delay: 0 }],
        [ 'setTaskProperty', tasks.plain, 'publish', {}],
        [ 'setTaskProperty', tasks.plain, 'publish-on-error', {}],
      ]);
    });

    it('deletes properties that are turned off', () => {
      const { container, commands } = renderProperties(tasks.full);

      PROPERTIES.forEach(name => fireEvent.click(toggle(container, name)));

      expect(commands).to.deep.equal([
        'join', 'with-items', 'concurrency', 'pause-before', 'wait-before', 'wait-after', 'timeout', 'retry', 'publish', 'publish-on-error',
      ].map(name => [ 'deleteTaskProperty', tasks.full, name ]));
    });

    it('joins all tasks, or a number of them', () => {
      const { container, getByText, commands } = renderProperties(tasks.counted);
      const joinField = container.querySelector('#joinField');

      expect(joinField.value).to.equal('2');

      fireEvent.click(getByText('Join all tasks'));
      fireEvent.change(joinField, { target: { value: '4' } });
      fireEvent.blur(joinField, { target: { value: '' } });

      expect(commands).to.deep.equal([
        [ 'setTaskProperty', tasks.counted, 'join', 'all' ],
        [ 'setTaskProperty', tasks.counted, 'join', 4 ],
        [ 'deleteTaskProperty', tasks.counted, 'join' ],
      ]);
    });

    it('sets the single-value properties as typed, ignoring emptied fields', () => {
      const { container, commands } = renderProperties(tasks.full);

      fireEvent.change(valueField(container, 'With Items'), { target: { value: 'y in <% $.ys %>' } });
      fireEvent.change(valueField(container, 'Concurrency'), { target: { value: '4' } });
      fireEvent.change(valueField(container, 'Wait Before'), { target: { value: '7' } });
      fireEvent.change(valueField(container, 'Timeout'), { target: { value: '120' } });
      fireEvent.change(valueField(container, 'Timeout'), { target: { value: '' } });

      expect(commands).to.deep.equal([
        [ 'setTaskProperty', tasks.full, 'with-items', 'y in <% $.ys %>' ],
        [ 'setTaskProperty', tasks.full, 'concurrency', '4' ],
        [ 'setTaskProperty', tasks.full, 'wait-before', '7' ],
        [ 'setTaskProperty', tasks.full, 'timeout', '120' ],
      ]);
    });

    it('edits the retry policy', () => {
      const { container, commands } = renderProperties(tasks.full);
      const retry = property(container, 'Retry');

      expect(field(retry, 'Count').value).to.equal('3');
      expect(field(retry, 'Delay').value).to.equal('1');
      expect(field(retry, 'Continue On').value).to.equal('<% $.go %>');
      expect(field(retry, 'Break On').value).to.equal('');

      fireEvent.change(field(retry, 'Count'), { target: { value: '5' } });
      fireEvent.change(field(retry, 'Delay'), { target: { value: '10' } });
      fireEvent.change(field(retry, 'Break On'), { target: { value: '<% $.stop %>' } });
      fireEvent.change(field(retry, 'Continue On'), { target: { value: '' } });

      expect(commands).to.deep.equal([
        [ 'setTaskProperty', tasks.full, [ 'retry', 'count' ], '5' ],
        [ 'setTaskProperty', tasks.full, [ 'retry', 'delay' ], '10' ],
        [ 'setTaskProperty', tasks.full, [ 'retry', 'break-on' ], '<% $.stop %>' ],
        [ 'deleteTaskProperty', tasks.full, [ 'retry', 'continue-on' ]],
      ]);
    });

    it('sets the publish dictionaries from JSON, refusing anything else', () => {
      const { container, commands } = renderProperties(tasks.full);
      const publish = valueField(container, 'Publish');

      fireEvent.change(publish, { target: { value: '{"a": "<% $.b %>"}' } });
      fireEvent.change(valueField(container, 'Publish On Error'), { target: { value: '{"e": 1}' } });
      fireEvent.change(publish, { target: { value: '[1]' } });

      expect(commands).to.deep.equal([
        [ 'setTaskProperty', tasks.full, 'publish', { a: '<% $.b %>' }],
        [ 'setTaskProperty', tasks.full, 'publish-on-error', { e: 1 }],
      ]);
      expect(property(container, 'Publish').querySelector('.st2-auto-form__error').textContent).to.equal('value is not an object');
    });
  });

  describe('MistralTransition', () => {
    let transitions;

    beforeEach(() => {
      transitions = model.transitions.filter(t => t.from.name === 'plain');
    });

    const renderTransition = (transition) => renderWithStore(
      <MistralTransition transition={transition} taskNames={TASK_NAMES} />
    );

    const [ typeSelect, doSelect ] = [ 0, 1 ].map(i => container => container.querySelectorAll('select')[i]);

    it('shows the type, condition and target', () => {
      const success = renderTransition(transitions[0]);
      expect(typeSelect(success.container).value).to.equal('Success');
      expect(success.container.querySelector('textarea').value).to.equal('<% $.ok %>');
      expect(doSelect(success.container).value).to.equal('full');
      success.unmount();

      const error = renderTransition(transitions[1]);
      expect(typeSelect(error.container).value).to.equal('Error');
      expect(error.container.querySelector('textarea').value).to.equal('');
      expect(doSelect(error.container).value).to.equal('counted');
    });

    it('updates the transition type, condition and target', () => {
      const { container, commands } = renderTransition(transitions[0]);
      const [ transition ] = transitions;
      const { from, to } = transition;

      fireEvent.change(typeSelect(container), { target: { value: 'Complete' } });
      fireEvent.change(container.querySelector('textarea'), { target: { value: '<% $.ok and $.go %>' } });
      fireEvent.change(doSelect(container), { target: { value: 'counted' } });

      expect(commands).to.deep.equal([
        [ 'updateTransition', transition, { type: 'Complete', from, to }],
        [ 'updateTransition', transition, { condition: '<% $.ok and $.go %>', from, to }],
        [ 'updateTransition', transition, { condition: '<% $.ok %>', from, to: [{ name: 'counted' }] }],
      ]);
    });

    it('sets the color as a transition property', () => {
      const { container, commands } = renderTransition(transitions[0]);
      const color = container.querySelector('input[style]');

      fireEvent.click(color);
      fireEvent.click(container.querySelectorAll('.st2-auto-form__field-options-menu-item-button')[1]);
      fireEvent.change(color, { target: { value: '' } });

      expect(commands).to.deep.equal([
        [ 'setTransitionProperty', transitions[0], 'color', '#d1583b' ],
        [ 'setTransitionProperty', transitions[0], 'color', '' ],
      ]);
    });
  });
});
