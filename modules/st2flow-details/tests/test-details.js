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
import { render, fireEvent } from '@testing-library/react';

import { OrquestaModel } from '@stackstorm/st2flow-model';
import MetaModel from '@stackstorm/st2flow-model/model-meta';

import Details from '..';
import flowStore from '../../../apps/st2-workflows/store';

import style from '../style.module.css';

const WORKFLOW = `version: 1.0
tasks:
  init:
    action: core.noop
`;

// A store that records what the panel dispatches.
function renderPanel(navigation = {}) {
  const model = new OrquestaModel(WORKFLOW);
  const actions = [];
  const store = createStore((state = {
    flow: {
      pack: 'examples',
      actions: [{ ref: 'core.noop', pack: 'core', parameters: {} }],
      navigation,
      meta: new MetaModel('pack: examples\nname: wf\nrunner_type: orquesta\n').tokenSet.toObject(),
      vars: [],
      tasks: model.tasks,
      transitions: model.transitions,
    },
  }, action) => {
    if (!action.type.startsWith('@@')) {
      actions.push(action);
    }
    return state;
  });
  const onChange = sinon.spy();

  return {
    ...render(
      <Provider store={store}>
        <Details onChange={onChange} />
      </Provider>
    ),
    actions,
    onChange,
  };
}

const navigations = actions => actions.map(({ type, navigation }) => {
  expect(type).to.equal('CHANGE_NAVIGATION');
  return navigation;
});

describe('st2flow-details Details', () => {
  let dispatch;

  beforeEach(() => {
    // autosave is kept in the app's flow store rather than the Provider's
    dispatch = sinon.stub(flowStore, 'dispatch');
  });

  afterEach(() => {
    dispatch.restore();
  });

  it('opens on the workflow metadata', () => {
    const { container } = renderPanel();

    expect(container.querySelector('.icon-gear').classList.contains(style.selected)).to.be.true;
    expect(container.querySelector('.icon-lan').classList.contains(style.selected)).to.be.false;
    expect(container.textContent).to.include('Runner Type');
  });

  it('switches between metadata, execution and code views', () => {
    const { container, actions } = renderPanel();

    fireEvent.click(container.querySelector('.icon-lan'));
    fireEvent.click(container.querySelector('.icon-gear'));
    fireEvent.click(container.querySelector('.icon-code'));

    expect(navigations(actions)).to.deep.equal([
      { type: 'execution', section: undefined },
      { type: 'metadata', section: undefined },
      { asCode: true },
    ]);
  });

  it('lists the tasks in the execution view, and opens the selected one', () => {
    const list = renderPanel({ type: 'execution' });
    expect(list.getByText('Workflow Tasks')).to.exist;
    list.unmount();

    const { getByText, queryByText, container, actions } = renderPanel({ type: 'execution', task: 'init' });
    expect(queryByText('Workflow Tasks')).to.equal(null);
    expect(getByText('init')).to.exist;

    fireEvent.click(container.querySelector('.icon-chevron_left'));
    expect(navigations(actions)).to.deep.equal([{ toTasks: undefined, task: undefined }]);
  });

  it('toggles autosave and reports the change', () => {
    const { container, onChange } = renderPanel();

    fireEvent.click(container.querySelector('#autosave-checkbox'));

    expect(dispatch.args.map(([ a ]) => a)).to.deep.equal([{ type: 'TOGGLE_AUTOSAVE', autosaveEnabled: true }]);
    expect(onChange.calledOnce).to.be.true;
  });
});
