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

import { OrquestaModel } from '@stackstorm/st2flow-model';

import TaskList from '../task-list';
import Task from '../task';

import style from '../style.module.css';

const WORKFLOW = `version: 1.0
tasks:
  init:
    action: core.local cmd="echo hi"
    next:
      - do: notify
  notify:
    action: slack.post_message
`;

// A store that records what the list dispatches.
function renderList(tasks = new OrquestaModel(WORKFLOW).tasks) {
  const actions = [];
  const store = createStore((state = { flow: { tasks }}, action) => {
    if (!action.type.startsWith('@@')) {
      actions.push(action);
    }
    return state;
  });

  return {
    ...render(
      <Provider store={store}>
        <TaskList />
      </Provider>
    ),
    actions,
  };
}

const taskRows = container => Array.from(container.querySelectorAll(`.${style.task}`));

describe('st2flow-details TaskList', () => {
  it('lists the workflow tasks with their action', () => {
    const { container, getByText } = renderList();

    expect(getByText('Workflow Tasks')).to.exist;
    // inline parameters are not part of the action ref
    expect(taskRows(container).map(row => row.textContent)).to.deep.equal([ 'initcore.local', 'notifyslack.post_message' ]);
  });

  it('navigates to a task when it is clicked', () => {
    const { container, actions } = renderList();

    fireEvent.click(within(container).getByText('notify'));

    expect(actions).to.deep.equal([{ type: 'CHANGE_NAVIGATION', navigation: { task: 'notify' } }]);
  });

  it('is empty for a workflow without tasks', () => {
    const { container } = renderList([]);

    expect(taskRows(container)).to.have.length(0);
  });
});

describe('st2flow-details Task', () => {
  const task = { name: 'init', action: 'core.local' };

  it('calls its click handlers without letting the event reach its parents', () => {
    const onClick = sinon.spy();
    const onDoubleClick = sinon.spy();
    const parentClick = sinon.spy();
    const { container } = render(
      <div onClick={parentClick} onDoubleClick={parentClick}>
        <Task task={task} onClick={onClick} onDoubleClick={onDoubleClick} />
      </div>
    );

    fireEvent.click(container.querySelector(`.${style.task}`));
    fireEvent.doubleClick(container.querySelector(`.${style.task}`));

    expect(onClick.calledOnce).to.be.true;
    expect(onDoubleClick.calledOnce).to.be.true;
    expect(parentClick.called).to.be.false;
  });

  it('lets clicks through when it has no handlers', () => {
    const parentClick = sinon.spy();
    const { container } = render(
      <div onClick={parentClick}>
        <Task task={task} />
      </div>
    );

    fireEvent.click(container.querySelector(`.${style.task}`));

    expect(parentClick.calledOnce).to.be.true;
  });
});
