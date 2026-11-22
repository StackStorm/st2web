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

import { OrquestaModel } from '@stackstorm/st2flow-model';

import OrquestaProperties from '../orquesta-properties';
import OrquestaTransition from '../orquesta-transition';

import style from '../style.module.css';

const WORKFLOW = `version: 1.0
tasks:
  plain:
    action: core.noop
    next:
      - when: <% succeeded() %>
        publish:
          - out: <% result().stdout %>
        do:
          - full
          - counted
      - when: <% failed() %>
        do: counted
      - when: <% completed() %>
  full:
    action: core.noop
    join: all
    with:
      items: x in <% ctx(xs) %>
      concurrency: 2
    delay: 5
    retry:
      when: <% failed() %>
      count: 3
      delay: 1
  counted:
    action: core.noop
    join: 3
`;

const TASK_NAMES = [ 'plain', 'full', 'counted' ];

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

describe('st2flow-details Orquesta', () => {
  let model;
  let tasks;

  beforeEach(() => {
    model = new OrquestaModel(WORKFLOW);
    tasks = Object.fromEntries(model.tasks.map(t => [ t.name, t ]));
  });

  describe('OrquestaProperties', () => {
    const renderProperties = task => renderWithStore(<OrquestaProperties task={task} />);

    it('reflects which properties the task has', () => {
      const plain = renderProperties(tasks.plain);
      expect([ 'Join', 'With Items', 'Delay', 'Retry' ].map(n => toggle(plain.container, n).checked)).to.deep.equal([ false, false, false, false ]);
      plain.unmount();

      const full = renderProperties(tasks.full);
      expect([ 'Join', 'With Items', 'Delay', 'Retry' ].map(n => toggle(full.container, n).checked)).to.deep.equal([ true, true, true, true ]);
    });

    it('turns properties on with a starting value', () => {
      const { container, commands } = renderProperties(tasks.plain);

      [ 'Join', 'With Items', 'Delay', 'Retry' ].forEach(name => fireEvent.click(toggle(container, name)));

      expect(commands).to.deep.equal([
        [ 'setTaskProperty', tasks.plain, 'join', 'all' ],
        [ 'setTaskProperty', tasks.plain, 'with', { items: 'x in <% ctx(y) %>' }],
        [ 'setTaskProperty', tasks.plain, 'delay', '10' ],
        [ 'setTaskProperty', tasks.plain, 'retry', { when: '<% failed() %>' }],
      ]);
      expect(commands[0][1]).to.equal(tasks.plain);
    });

    it('deletes properties that are turned off', () => {
      const { container, commands } = renderProperties(tasks.full);

      [ 'Join', 'With Items', 'Delay', 'Retry' ].forEach(name => fireEvent.click(toggle(container, name)));

      expect(commands).to.deep.equal([
        [ 'deleteTaskProperty', tasks.full, 'join' ],
        [ 'deleteTaskProperty', tasks.full, 'with' ],
        [ 'deleteTaskProperty', tasks.full, 'delay' ],
        [ 'deleteTaskProperty', tasks.full, 'retry' ],
      ]);
    });

    describe('join', () => {
      const joinField = container => container.querySelector('#joinField');

      it('joins all tasks, or a number of them', () => {
        const { container, getByText, commands } = renderProperties(tasks.counted);

        expect(joinField(container).value).to.equal('3');

        fireEvent.click(getByText('Join all tasks'));
        fireEvent.change(joinField(container), { target: { value: '2' } });

        expect(commands).to.deep.equal([
          [ 'setTaskProperty', tasks.counted, 'join', 'all' ],
          [ 'setTaskProperty', tasks.counted, 'join', 2 ],
        ]);
      });

      it('offers 10 tasks when joining all, and switches to that count', () => {
        const { container, commands } = renderProperties(tasks.full);

        expect(joinField(container).value).to.equal('10');

        fireEvent.click(joinField(container).closest('label'));

        expect(commands).to.have.length.above(0);
        commands.forEach(c => expect(c).to.deep.equal([ 'setTaskProperty', tasks.full, 'join', 10 ]));
      });

      it('keeps an emptied count while typing and drops it on blur', () => {
        const { container, commands } = renderProperties(tasks.counted);

        fireEvent.change(joinField(container), { target: { value: '' } });
        fireEvent.blur(joinField(container), { target: { value: '' } });

        expect(commands).to.deep.equal([
          [ 'setTaskProperty', tasks.counted, 'join', 0 ],
          [ 'deleteTaskProperty', tasks.counted, 'join' ],
        ]);
      });
    });

    it('edits the with items and concurrency', () => {
      const { container, commands } = renderProperties(tasks.full);
      const withItems = property(container, 'With Items');

      expect(field(withItems, 'items').value).to.equal('x in <% ctx(xs) %>');
      expect(field(withItems, 'concurrency').value).to.equal('2');

      fireEvent.change(field(withItems, 'items'), { target: { value: 'y in <% ctx(ys) %>' } });
      fireEvent.change(field(withItems, 'concurrency'), { target: { value: '4' } });
      fireEvent.change(field(withItems, 'concurrency'), { target: { value: '' } });

      expect(commands).to.deep.equal([
        [ 'setTaskProperty', tasks.full, [ 'with', 'items' ], 'y in <% ctx(ys) %>' ],
        [ 'setTaskProperty', tasks.full, [ 'with', 'concurrency' ], '4' ],
        [ 'deleteTaskProperty', tasks.full, [ 'with', 'concurrency' ]],
      ]);
    });

    it('sets the delay as a number of seconds or an expression', () => {
      const { container, commands } = renderProperties(tasks.full);
      const delay = container.querySelector('#delayField');

      expect(delay.value).to.equal('5');

      fireEvent.change(delay, { target: { value: '30' } });
      fireEvent.change(delay, { target: { value: '<% ctx(wait) %>' } });

      expect(commands).to.deep.equal([
        [ 'setTaskProperty', tasks.full, 'delay', 30 ],
        [ 'setTaskProperty', tasks.full, 'delay', '<% ctx(wait) %>' ],
      ]);
    });

    it('edits the retry condition, count and delay', () => {
      const { container, commands } = renderProperties(tasks.full);
      const retry = property(container, 'Retry');

      expect(field(retry, 'when').value).to.equal('<% failed() %>');
      expect(field(retry, 'count').value).to.equal('3');
      expect(field(retry, 'delay (seconds)').value).to.equal('1');

      fireEvent.change(field(retry, 'when'), { target: { value: '<% failed() or timedout() %>' } });
      fireEvent.change(field(retry, 'count'), { target: { value: '5' } });
      fireEvent.change(field(retry, 'count'), { target: { value: '<% ctx(n) %>' } });
      fireEvent.change(field(retry, 'delay (seconds)'), { target: { value: '15' } });

      expect(commands).to.deep.equal([
        [ 'setTaskProperty', tasks.full, [ 'retry', 'when' ], '<% failed() or timedout() %>' ],
        [ 'setTaskProperty', tasks.full, [ 'retry', 'count' ], 5 ],
        [ 'setTaskProperty', tasks.full, [ 'retry', 'count' ], '<% ctx(n) %>' ],
        [ 'setTaskProperty', tasks.full, [ 'retry', 'delay' ], 15 ],
      ]);
    });
  });

  describe('OrquestaTransition', () => {
    let transitions;

    beforeEach(() => {
      // the three transitions out of `plain`, in order
      transitions = model.transitions.filter(t => t.from.name === 'plain');
    });

    const renderTransition = (transition) => renderWithStore(
      <OrquestaTransition transition={transition} taskNames={TASK_NAMES} />
    );

    const publishToggle = container => container.querySelector('.st2-forms__switch input');
    const publishPanel = container => container.querySelector(`.${style.stringProperties}`);
    const doSelects = container => Array.from(container.querySelectorAll('select'));
    // the delete/add buttons of the do targets, not those of the publish list
    const doButtons = (container, icon) => Array.from(container.querySelectorAll(`.${icon}`))
      .filter(i => !publishPanel(container).contains(i));

    it('shows the condition, publish and do targets', () => {
      const { container } = renderTransition(transitions[0]);

      expect(container.querySelector('textarea').value).to.equal('<% succeeded() %>');
      expect(publishToggle(container).checked).to.be.true;
      expect(Array.from(publishPanel(container).querySelectorAll('input, textarea')).map(f => f.value))
        .to.deep.equal([ 'out', '<% result().stdout %>' ]);
      expect(doSelects(container).map(s => s.value)).to.deep.equal([ 'full', 'counted' ]);
    });

    it('sets the condition, and deletes it once cleared', () => {
      const { container, commands } = renderTransition(transitions[0]);
      const when = container.querySelector('textarea');

      fireEvent.change(when, { target: { value: '<% succeeded() and ctx(ok) %>' } });
      fireEvent.change(when, { target: { value: '' } });

      expect(commands).to.deep.equal([
        [ 'setTransitionProperty', transitions[0], 'when', '<% succeeded() and ctx(ok) %>' ],
        [ 'deleteTransitionProperty', transitions[0], 'when' ],
      ]);
    });

    describe('publish', () => {
      it('removes the publish when toggled off and restores it when toggled back on', () => {
        const { container, commands } = renderTransition(transitions[0]);

        fireEvent.click(publishToggle(container));
        expect(publishToggle(container).checked).to.be.false;
        fireEvent.click(publishToggle(container));

        expect(commands).to.deep.equal([
          [ 'deleteTransitionProperty', transitions[0], 'publish' ],
          [ 'setTransitionProperty', transitions[0], 'publish', [{ out: '<% result().stdout %>' }]],
        ]);
      });

      it('starts a publish with a placeholder when toggled on', () => {
        const { container, commands } = renderTransition(transitions[1]);

        expect(publishToggle(container).checked).to.be.false;
        fireEvent.click(publishToggle(container));

        expect(commands).to.deep.equal([
          [ 'setTransitionProperty', transitions[1], 'publish', [{ key: '<% result().val %>' }]],
        ]);
      });

      it('edits, adds and removes published variables', () => {
        const { container, commands } = renderTransition(transitions[0]);
        const panel = publishPanel(container);

        fireEvent.change(panel.querySelector('textarea'), { target: { value: '<% result().stderr %>' } });
        fireEvent.change(panel.querySelector('input'), { target: { value: 'err' } });
        fireEvent.click(panel.querySelector('.icon-plus'));
        fireEvent.click(panel.querySelector('.icon-delete'));

        expect(commands).to.deep.equal([
          [ 'setTransitionProperty', transitions[0], 'publish', [{ out: '<% result().stderr %>' }]],
          [ 'setTransitionProperty', transitions[0], 'publish', [{ err: '<% result().stdout %>' }]],
          [ 'setTransitionProperty', transitions[0], 'publish', [{ out: '<% result().stdout %>' }, { key: '<% result().val %>' }]],
          [ 'setTransitionProperty', transitions[0], 'publish', []],
        ]);
        // removing the last variable turns publishing off
        expect(publishToggle(container).checked).to.be.false;
      });
    });

    describe('do', () => {
      it('only offers each task once across the targets', () => {
        const { container } = renderTransition(transitions[0]);

        const options = doSelects(container).map(s => Array.from(s.options).map(o => o.value));
        expect(options).to.deep.equal([[ 'plain', 'full' ], [ 'plain', 'counted' ]]);
      });

      it('changes, removes and adds targets', () => {
        const { container, commands } = renderTransition(transitions[0]);

        fireEvent.change(doSelects(container)[0], { target: { value: 'plain' } });
        fireEvent.click(doButtons(container, 'icon-delete')[0]);
        // the add button on the last target appends the first task still free
        fireEvent.click(doButtons(container, 'icon-plus')[0]);

        expect(commands).to.deep.equal([
          [ 'setTransitionProperty', transitions[0], 'do', [ 'plain', 'counted' ]],
          [ 'setTransitionProperty', transitions[0], 'do', [ 'counted' ]],
          [ 'setTransitionProperty', transitions[0], 'do', [ 'full', 'counted', 'plain' ]],
        ]);
      });

      it('picks the first target of a transition with none', () => {
        const { container, commands } = renderTransition(transitions[2]);

        const [ select ] = doSelects(container);
        expect(select.value).to.equal('');

        fireEvent.change(select, { target: { value: 'counted' } });

        expect(commands).to.deep.equal([
          [ 'setTransitionProperty', transitions[2], 'do', [ 'counted' ]],
        ]);
      });
    });

    it('sets the color from the palette or by typing', () => {
      const { container, commands } = renderTransition(transitions[0]);
      const color = container.querySelector('input[style]');

      fireEvent.click(color);
      fireEvent.click(container.querySelector('.st2-auto-form__field-options-menu-item-button'));
      fireEvent.change(color, { target: { value: '#123456' } });

      expect(commands).to.deep.equal([
        [ 'setTransitionProperty', transitions[0], 'color', '#fecb2f' ],
        [ 'setTransitionProperty', transitions[0], 'color', '#123456' ],
      ]);
    });
  });
});
