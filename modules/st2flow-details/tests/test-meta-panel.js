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

import { describe, it, beforeEach, afterEach } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';

import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { render, fireEvent, act } from '@testing-library/react';

import MetaModel from '@stackstorm/st2flow-model/model-meta';

import Meta from '../meta-panel';
import flowStore from '../../../apps/st2-workflows/store';

const META = [
  'pack: examples',
  'name: my_wf',
  'description: Does a thing',
  'runner_type: orquesta',
  'enabled: true',
  'entry_point: workflows/my_wf.yaml',
  '',
].join('\n');

// A store that records what the panel dispatches; TEST_SET_FLOW swaps in new flow state.
function makeStore(flow) {
  const actions = [];
  const store = createStore((state = { flow }, action) => {
    if (action.type === 'TEST_SET_FLOW') {
      return { flow: { ...state.flow, ...action.flow } };
    }
    if (!action.type.startsWith('@@')) {
      actions.push(action);
    }
    return state;
  });

  return { store, actions };
}

function renderMeta(flow = {}, props = {}) {
  const { store, actions } = makeStore({
    pack: 'examples',
    actions: [{ ref: 'core.local', pack: 'core' }],
    navigation: {},
    meta: new MetaModel(META).tokenSet.toObject(),
    vars: [],
    ...flow,
  });
  const onChange = sinon.spy();
  const result = render(
    <Provider store={store}>
      <Meta onChange={onChange} {...props} />
    </Provider>
  );

  return { ...result, store, actions, onChange };
}

// the input of the auto-form field titled `name`
const field = (container, name) => {
  const title = Array.from(container.querySelectorAll('.st2-auto-form__title'))
    .find(t => t.textContent.replace(/ \*$/, '') === name);
  return title.closest('label').querySelector('textarea, input, select');
};

const metaCommands = actions => actions
  .filter(a => a.type === 'META_ISSUE_COMMAND')
  .map(({ command, args }) => [ command, ...args ]);

describe('st2flow-details Meta panel', () => {
  describe('meta section', () => {
    it('shows the workflow meta fields', () => {
      const { container } = renderMeta();

      expect(field(container, 'Runner Type').value).to.equal('orquesta');
      expect(field(container, 'Pack').value).to.equal('examples');
      expect(field(container, 'Name').value).to.equal('my_wf');
      expect(field(container, 'Description').value).to.equal('Does a thing');
      expect(container.querySelector('.st2-auto-form__checkbox').checked).to.be.true;
      expect(field(container, 'Entry point').value).to.equal('workflows/my_wf.yaml');
    });

    it('offers the packs of the known actions plus the current one', () => {
      const { container } = renderMeta();

      const options = Array.from(field(container, 'Pack').options).map(o => o.value);
      expect(options).to.deep.equal([ '', 'core', 'examples' ]);
    });

    it('sets description, runner type, enabled and entry point through meta commands', () => {
      const { container, actions } = renderMeta();

      fireEvent.change(field(container, 'Description'), { target: { value: 'Does another thing' } });
      fireEvent.change(field(container, 'Runner Type'), { target: { value: 'mistral-v2' } });
      fireEvent.click(container.querySelector('.st2-auto-form__checkbox'));
      fireEvent.change(field(container, 'Entry point'), { target: { value: 'workflows/other.yaml' } });

      expect(metaCommands(actions)).to.deep.equal([
        [ 'set', 'description', 'Does another thing' ],
        [ 'set', 'runner_type', 'mistral-v2' ],
        [ 'set', 'enabled', false ],
        [ 'set', 'entry_point', 'workflows/other.yaml' ],
      ]);
    });

    it('switches the pack in the store and in the meta', () => {
      const { container, actions } = renderMeta();

      fireEvent.change(field(container, 'Pack'), { target: { value: 'core' } });

      expect(actions).to.deep.equal([
        { type: 'SET_PACK', pack: 'core' },
        { type: 'META_ISSUE_COMMAND', command: 'set', args: [ 'pack', 'core' ] },
      ]);
    });

    describe('renaming', () => {
      let dispatch;

      beforeEach(() => {
        // the name field talks to the app's flow store directly rather than the Provider's
        dispatch = sinon.stub(flowStore, 'dispatch');
      });

      afterEach(() => {
        dispatch.restore();
      });

      it('sets the name and an entry point that follows it', () => {
        const { container } = renderMeta();

        fireEvent.change(field(container, 'Name'), { target: { value: 'renamed' } });

        expect(dispatch.args.map(([ a ]) => a)).to.deep.equal([
          { type: 'META_ISSUE_COMMAND', command: 'set', args: [ 'name', 'renamed' ] },
          { type: 'META_ISSUE_COMMAND', command: 'set', args: [ 'entry_point', 'workflows/renamed.yaml' ] },
        ]);
      });

      it('reports a failed meta command as an error', () => {
        const error = new Error('bad name');
        dispatch.onFirstCall().throws(error);
        const { container } = renderMeta();

        fireEvent.change(field(container, 'Name'), { target: { value: 'renamed' } });

        expect(dispatch.lastCall.args[0]).to.deep.equal({ type: 'PUSH_ERROR', error });
      });
    });

    it('defaults the runner type to orquesta once the meta updates without one', () => {
      const { store, actions } = renderMeta();

      act(() => {
        store.dispatch({ type: 'TEST_SET_FLOW', flow: { meta: new MetaModel('pack: examples\n').tokenSet.toObject() } });
      });

      expect(metaCommands(actions)).to.deep.equal([[ 'set', 'runner_type', 'orquesta' ]]);
    });

    it('calls onChange when the meta or the vars change, so autosave can run', () => {
      const { store, onChange } = renderMeta();

      act(() => {
        store.dispatch({ type: 'TEST_SET_FLOW', flow: { navigation: { section: 'meta' } } });
      });
      expect(onChange.called).to.be.false;

      act(() => {
        store.dispatch({ type: 'TEST_SET_FLOW', flow: { meta: new MetaModel(META).tokenSet.toObject() } });
      });
      expect(onChange.callCount).to.equal(1);

      act(() => {
        store.dispatch({ type: 'TEST_SET_FLOW', flow: { vars: [{ a: 1 }] } });
      });
      expect(onChange.callCount).to.equal(2);
    });
  });

  it('navigates between the meta, parameters and vars sections', () => {
    const { getByText, actions } = renderMeta();

    fireEvent.click(getByText('Parameters'));
    fireEvent.click(getByText('Vars'));
    fireEvent.click(getByText('Meta'));

    expect(actions.map(a => a.navigation)).to.deep.equal([
      { section: 'parameters' },
      { section: 'vars' },
      { section: 'meta' },
    ]);
  });

  it('shows the parameters panel in the parameters section', () => {
    const { getByText, queryByText } = renderMeta({ navigation: { section: 'parameters' } });

    expect(getByText('Add parameter')).to.exist;
    expect(queryByText('Runner Type')).to.equal(null);
  });

  describe('vars section', () => {
    const renderVars = (vars) => renderMeta({ navigation: { section: 'vars' }, vars });
    const keyFields = container => container.querySelectorAll('input.st2-auto-form__field');
    const valueFields = container => container.querySelectorAll('textarea.st2-auto-form__field');
    const setVars = actions => actions
      .filter(a => a.type === 'MODEL_ISSUE_COMMAND')
      .map(({ command, args }) => {
        expect(command).to.equal('setVars');
        return args[0];
      });

    it('lists the vars as key/value pairs, objects as JSON', () => {
      const { container } = renderVars([{ count: 3 }, { conf: { a: 1 }}, { empty: null }]);

      expect(Array.from(keyFields(container)).map(f => f.value)).to.deep.equal([ 'count', 'conf', 'empty' ]);
      expect(Array.from(valueFields(container)).map(f => f.value)).to.deep.equal([ '3', '{\n  "a": 1\n}', '' ]);
    });

    it('parses JSON objects, but keeps scalars and expressions as strings', () => {
      const { container, actions } = renderVars([{ a: 'x' }, { b: 'y' }, { c: 'z' }]);
      const [ a, b, c ] = valueFields(container);

      fireEvent.change(a, { target: { value: '{"k": [1, 2]}' } });
      fireEvent.change(b, { target: { value: '42' } });
      fireEvent.change(c, { target: { value: '{{ st2kv.system.k }}' } });

      expect(setVars(actions)).to.deep.equal([
        [{ a: { k: [ 1, 2 ] }}, { b: 'y' }, { c: 'z' }],
        [{ a: 'x' }, { b: '42' }, { c: 'z' }],
        [{ a: 'x' }, { b: 'y' }, { c: '{{ st2kv.system.k }}' }],
      ]);
    });

    it('renames a var key', () => {
      const { container, actions } = renderVars([{ a: 'x' }]);

      fireEvent.change(keyFields(container)[0], { target: { value: 'renamed' } });

      expect(setVars(actions)).to.deep.equal([[{ renamed: 'x' }]]);
    });

    it('adds and removes vars', () => {
      const { container, getByDisplayValue, actions } = renderVars([{ a: 'x' }, { b: 'y' }]);

      fireEvent.click(getByDisplayValue('Add variable'));
      fireEvent.click(container.querySelectorAll('.icon-delete')[0]);

      expect(setVars(actions)).to.deep.equal([
        [{ a: 'x' }, { b: 'y' }, { key: '' }],
        [{ b: 'y' }],
      ]);
    });

    it('adds the first var when there are none', () => {
      const { getByDisplayValue, actions } = renderVars(undefined);

      fireEvent.click(getByDisplayValue('Add variable'));

      expect(setVars(actions)).to.deep.equal([[{ key: '' }]]);
    });
  });
});
