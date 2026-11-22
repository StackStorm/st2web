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

const ACTIONS = [
  { ref: 'core.remote', pack: 'core', name: 'remote' },
  { ref: 'linux.wait', pack: 'linux', name: 'wait' },
  { ref: 'core.local', pack: 'core', name: 'local' },
  { ref: 'core.http', pack: 'core', name: 'http' },
];

// the shape of the groups the reducer builds: { pack: [ refs ] }
const groupRefs = () => Object.fromEntries(
  store.getState().groups.map(({ pack, actions }) => [ pack, actions.map(({ ref }) => ref) ])
);

// The scoped store lives on the shared root store, so put back what earlier tests changed.
function reset() {
  store.dispatch({ type: 'SET_FILTER', filter: '' });
  store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: [] });
  store.dispatch({ type: 'FETCH_ACTION', status: 'success', payload: undefined });
  store.dispatch({ type: 'FETCH_EXECUTIONS', status: 'success', payload: [] });
  store.dispatch({ type: 'FETCH_ENTRYPOINT', status: 'success', payload: '' });
}

describe('actions store', () => {
  beforeEach(reset);

  describe('groups', () => {
    it('groups actions by pack, sorted by ref', () => {
      store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: ACTIONS });

      expect(store.getState().actions).to.equal(ACTIONS);
      expect(groupRefs()).to.deep.equal({
        core: [ 'core.http', 'core.local', 'core.remote' ],
        linux: [ 'linux.wait' ],
      });
    });

    it('keeps the previous list while a fetch is pending or after it fails', () => {
      store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: ACTIONS });

      store.dispatch({ type: 'FETCH_GROUPS' });
      store.dispatch({ type: 'FETCH_GROUPS', status: 'error', error: new Error('boom') });

      expect(store.getState().actions).to.equal(ACTIONS);
      expect(groupRefs()).to.have.keys('core', 'linux');
    });

    it('filters by ref, ignoring case, and drops packs with no match', () => {
      store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: ACTIONS });

      store.dispatch({ type: 'SET_FILTER', filter: 'LOC' });
      expect(store.getState().filter).to.equal('LOC');
      expect(groupRefs()).to.deep.equal({ core: [ 'core.local' ] });

      store.dispatch({ type: 'SET_FILTER', filter: 'nothing' });
      expect(store.getState().groups).to.deep.equal([]);

      store.dispatch({ type: 'SET_FILTER', filter: '' });
      expect(groupRefs()).to.have.keys('core', 'linux');
    });

    it('applies the current filter to a freshly fetched list', () => {
      store.dispatch({ type: 'SET_FILTER', filter: 'wait' });
      store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: ACTIONS });

      expect(groupRefs()).to.deep.equal({ linux: [ 'linux.wait' ] });
    });

    it('removes a deleted action once the delete succeeds, keeping the filter', () => {
      store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: ACTIONS });
      store.dispatch({ type: 'SET_FILTER', filter: 'core' });

      store.dispatch({ type: 'DELETE_ACTION', ref: 'core.local' });
      store.dispatch({ type: 'DELETE_ACTION', ref: 'core.local', status: 'error', error: new Error('no') });
      expect(groupRefs().core).to.include('core.local');

      store.dispatch({ type: 'DELETE_ACTION', ref: 'core.local', status: 'success', payload: {} });
      expect(store.getState().actions.map(({ ref }) => ref)).to.not.include('core.local');
      expect(groupRefs()).to.deep.equal({ core: [ 'core.http', 'core.remote' ] });
    });
  });

  describe('selected action', () => {
    it('stores the fetched action and its entrypoint', () => {
      const action = { ref: 'core.local', parameters: { cmd: { type: 'string' }}};

      store.dispatch({ type: 'FETCH_ACTION', status: 'success', payload: action });
      store.dispatch({ type: 'FETCH_ENTRYPOINT', status: 'success', payload: 'echo hello' });

      expect(store.getState().action).to.equal(action);
      expect(store.getState().entrypoint).to.equal('echo hello');

      store.dispatch({ type: 'FETCH_ACTION', status: 'error', error: new Error('gone') });
      store.dispatch({ type: 'FETCH_ENTRYPOINT', status: 'error', error: new Error('gone') });

      expect(store.getState().action).to.equal(action);
      expect(store.getState().entrypoint).to.equal('echo hello');
    });
  });

  describe('executions', () => {
    const execution = (id, start_timestamp, status = 'succeeded') => ({ id, start_timestamp, status });
    const ids = () => store.getState().executions.map(({ id, status }) => `${id}:${status}`);

    beforeEach(() => {
      store.dispatch({
        type: 'FETCH_EXECUTIONS',
        status: 'success',
        payload: [ execution('b', '2026-01-02'), execution('a', '2026-01-01') ],
      });
    });

    it('sorts fetched executions by start time', () => {
      expect(ids()).to.deep.equal([ 'a:succeeded', 'b:succeeded' ]);
    });

    it('adds created executions once', () => {
      store.dispatch({ type: 'CREATE_EXECUTION', record: execution('c', '2026-01-03', 'running') });
      store.dispatch({ type: 'CREATE_EXECUTION', record: execution('c', '2026-01-03', 'succeeded') });

      expect(ids()).to.deep.equal([ 'a:succeeded', 'b:succeeded', 'c:running' ]);
    });

    it('replaces updated executions in place, or adds unknown ones', () => {
      store.dispatch({ type: 'UPDATE_EXECUTION', record: execution('a', '2026-01-01', 'failed') });
      store.dispatch({ type: 'UPDATE_EXECUTION', record: execution('0', '2025-12-31', 'running') });

      expect(ids()).to.deep.equal([ '0:running', 'a:failed', 'b:succeeded' ]);
    });

    it('removes deleted executions', () => {
      store.dispatch({ type: 'DELETE_EXECUTION', record: execution('a', '2026-01-01') });
      store.dispatch({ type: 'DELETE_EXECUTION', record: execution('zzz', '2026-01-01') });

      expect(ids()).to.deep.equal([ 'b:succeeded' ]);
    });
  });

  describe('pack tables', () => {
    it('collapses all packs only when every one is collapsed, and toggles them together', () => {
      store.dispatch(flexActions.register('core', true));
      store.dispatch(flexActions.register('linux', false));
      expect(store.getState().collapsed).to.be.false;

      store.dispatch(flexActions.toggle('linux'));
      expect(store.getState().collapsed).to.be.true;

      store.dispatch(flexActions.toggleAll());
      expect(store.getState().tables.core.collapsed).to.be.false;
      expect(store.getState().tables.linux.collapsed).to.be.false;
      expect(store.getState().collapsed).to.be.false;
    });
  });
});
