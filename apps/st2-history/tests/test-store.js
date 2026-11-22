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

import { actions as flexActions } from '@stackstorm/module-flex-table/flex-table.reducer';

import store from '../store';

// Noon UTC keeps every execution on its calendar day in any timezone the tests run in.
const execution = (id, day, hour = 12, extra) => ({
  id,
  status: 'succeeded',
  start_timestamp: `2026-10-${day}T${hour}:00:00.000Z`,
  action: { ref: 'core.local' },
  ...extra,
});

const dayOf = (day) => new Date(new Date(`2026-10-${day}T12:00:00.000Z`).toDateString()).toISOString();
const groupIds = () => store.getState().groups.map(({ date, executions }) => [ date, executions.map(({ id }) => id) ]);

describe('history store', () => {
  // The scoped store lives in the shared root store for the whole file, so start from known data.
  beforeEach(async () => {
    await store.dispatch({ type: 'FETCH_GROUPS', promise: Promise.resolve([]) });
    await store.dispatch({ type: 'FETCH_EXECUTION', promise: Promise.resolve(undefined) });
    store.dispatch({ type: 'UPDATE_FILTER', value: undefined });
    for (const id of Object.keys(store.getState().childExecutions)) {
      store.dispatch({ type: 'FETCH_EXECUTION_CHILDREN', id, expanded: false });
    }
  });

  describe('filters', () => {
    it('keeps the filters that offer a choice and labels them', async () => {
      await store.dispatch({
        type: 'FETCH_FILTERS',
        promise: Promise.resolve({
          action: [ 'core.local', 'core.http' ],
          status: [ 'failed', 'succeeded' ],
          trigger_type: [ 'core.st2.webhook', 'core.st2.IntervalTimer' ],
          rule: [ 'only.one' ],
          user: 'not-a-list',
        }),
      });

      expect(store.getState().filters).to.deep.equal([
        { key: 'action', label: 'Action', items: [ 'core.local', 'core.http' ] },
        { key: 'status', label: 'Status', items: [ 'failed', 'succeeded' ] },
        { key: 'trigger_type', label: 'Trigger Type', items: [ 'core.st2.webhook', 'core.st2.IntervalTimer' ] },
      ]);
    });

    it('stores the advanced filter string', () => {
      store.dispatch({ type: 'UPDATE_FILTER', value: 'status:failed' });

      expect(store.getState().filter).to.equal('status:failed');
    });
  });

  describe('groups', () => {
    it('groups executions by day, newest first', async () => {
      await store.dispatch({
        type: 'FETCH_GROUPS',
        promise: Promise.resolve([
          execution('a', 29, 10),
          execution('b', 30, 11),
          execution('c', 29, 14),
          execution('d', 30, 13),
        ]),
      });

      expect(groupIds()).to.deep.equal([
        [ dayOf(30), [ 'd', 'b' ]],
        [ dayOf(29), [ 'c', 'a' ]],
      ]);
      expect(store.getState().executions.map(({ id }) => id)).to.deep.equal([ 'a', 'b', 'c', 'd' ]);
    });

    it('keeps the previous groups while a fetch is pending or after it fails', async () => {
      await store.dispatch({ type: 'FETCH_GROUPS', promise: Promise.resolve([ execution('a', 29) ]) });

      store.dispatch({ type: 'FETCH_GROUPS' });
      expect(groupIds()).to.deep.equal([[ dayOf(29), [ 'a' ]]]);

      await store.dispatch({ type: 'FETCH_GROUPS', promise: Promise.reject(new Error('boom')) });
      expect(groupIds()).to.deep.equal([[ dayOf(29), [ 'a' ]]]);
    });

    it('stores the selected execution', async () => {
      await store.dispatch({ type: 'FETCH_EXECUTION', promise: Promise.resolve(execution('a', 29)) });

      expect(store.getState().execution.id).to.equal('a');
    });
  });

  describe('children', () => {
    it('stores the children of an expanded execution in start order and drops them on collapse', async () => {
      await store.dispatch({
        type: 'FETCH_EXECUTION_CHILDREN',
        id: 'a',
        expanded: true,
        promise: Promise.resolve([ execution('a2', 29, 14), execution('a1', 29, 13) ]),
      });

      expect(store.getState().childExecutions.a.map(({ id }) => id)).to.deep.equal([ 'a1', 'a2' ]);

      store.dispatch({ type: 'FETCH_EXECUTION_CHILDREN', id: 'a', expanded: false, promise: null });

      expect(store.getState().childExecutions).to.not.have.property('a');
    });

    it('does not expand an execution whose children failed to load', async () => {
      await store.dispatch({
        type: 'FETCH_EXECUTION_CHILDREN',
        id: 'a',
        expanded: true,
        promise: Promise.reject(new Error('boom')),
      });

      expect(store.getState().childExecutions).to.not.have.property('a');
    });
  });

  describe('live updates', () => {
    beforeEach(async () => {
      await store.dispatch({ type: 'FETCH_GROUPS', promise: Promise.resolve([ execution('a', 29), execution('b', 30) ]) });
      await store.dispatch({ type: 'FETCH_EXECUTION', promise: Promise.resolve(execution('b', 30)) });
      await store.dispatch({
        type: 'FETCH_EXECUTION_CHILDREN',
        id: 'b',
        expanded: true,
        promise: Promise.resolve([ execution('b1', 30, 13) ]),
      });
    });

    it('adds new executions to their day', () => {
      store.dispatch({ type: 'CREATE_EXECUTION', record: execution('c', 30, 15) });
      store.dispatch({ type: 'CREATE_EXECUTION', record: execution('d', 31) });

      expect(groupIds()).to.deep.equal([
        [ dayOf(31), [ 'd' ]],
        [ dayOf(30), [ 'c', 'b' ]],
        [ dayOf(29), [ 'a' ]],
      ]);
    });

    it('ignores a create event for an execution it already has', () => {
      const before = store.getState().groups;

      store.dispatch({ type: 'CREATE_EXECUTION', record: execution('a', 29) });

      expect(store.getState().groups).to.equal(before);
    });

    it('adds new children to an expanded parent only', () => {
      store.dispatch({ type: 'CREATE_EXECUTION', record: execution('b0', 30, 12, { parent: 'b' }) });
      store.dispatch({ type: 'CREATE_EXECUTION', record: execution('a1', 29, 13, { parent: 'a' }) });
      store.dispatch({ type: 'CREATE_EXECUTION', record: execution('b1', 30, 13, { parent: 'b' }) });

      const { childExecutions } = store.getState();
      expect(childExecutions.b.map(({ id }) => id)).to.deep.equal([ 'b0', 'b1' ]);
      expect(childExecutions).to.not.have.property('a');
      // children never show up as top-level rows
      expect(groupIds().flatMap(([ , ids ]) => ids)).to.deep.equal([ 'b', 'a' ]);
    });

    it('replaces updated executions, including the one on display', () => {
      store.dispatch({ type: 'UPDATE_EXECUTION', record: execution('b', 30, 12, { status: 'failed' }) });

      const { groups, executions, execution: shown } = store.getState();
      expect(shown.status).to.equal('failed');
      expect(executions.find(({ id }) => id === 'b').status).to.equal('failed');
      expect(groups[0].executions[0].status).to.equal('failed');
    });

    it('updates the execution on display only when it is the one that changed', () => {
      store.dispatch({ type: 'UPDATE_EXECUTION', record: execution('a', 29, 12, { status: 'failed' }) });

      expect(store.getState().execution.status).to.equal('succeeded');
      expect(store.getState().executions.find(({ id }) => id === 'a').status).to.equal('failed');
    });

    it('adds an execution it only learns about from an update', () => {
      store.dispatch({ type: 'UPDATE_EXECUTION', record: execution('c', 31) });

      expect(groupIds()[0]).to.deep.equal([ dayOf(31), [ 'c' ]]);
    });

    it('updates children of an expanded parent in place', () => {
      store.dispatch({ type: 'UPDATE_EXECUTION', record: execution('b1', 30, 13, { parent: 'b', status: 'failed' }) });
      store.dispatch({ type: 'UPDATE_EXECUTION', record: execution('b2', 30, 14, { parent: 'b' }) });

      const children = store.getState().childExecutions.b;
      expect(children.map(({ id, status }) => [ id, status ])).to.deep.equal([
        [ 'b1', 'failed' ],
        [ 'b2', 'succeeded' ],
      ]);
    });

    it('removes deleted executions and children', () => {
      store.dispatch({ type: 'DELETE_EXECUTION', record: execution('a', 29) });
      store.dispatch({ type: 'DELETE_EXECUTION', record: execution('b1', 30, 13, { parent: 'b' }) });

      expect(groupIds()).to.deep.equal([[ dayOf(30), [ 'b' ]]]);
      expect(store.getState().childExecutions.b).to.deep.equal([]);
    });
  });

  it('tracks the collapsed state of the day tables', () => {
    store.dispatch(flexActions.register(dayOf(29), false));
    store.dispatch(flexActions.register(dayOf(30), false));

    store.dispatch(flexActions.toggleAll());
    expect(store.getState().collapsed).to.be.true;

    store.dispatch(flexActions.toggle(dayOf(29)));
    expect(store.getState().tables[dayOf(29)].collapsed).to.be.false;
    expect(store.getState().collapsed).to.be.false;
  });
});
