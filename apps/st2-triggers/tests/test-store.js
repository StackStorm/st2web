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

const TRIGGERS = [
  { ref: 'core.st2.webhook', pack: 'core', name: 'st2.webhook' },
  { ref: 'linux.file_watch.line', pack: 'linux', name: 'file_watch.line' },
  { ref: 'core.st2.CronTimer', pack: 'core', name: 'st2.CronTimer' },
  { ref: 'core.st2.IntervalTimer', pack: 'core', name: 'st2.IntervalTimer' },
];

const SENSORS = [
  { ref: 'linux.FileWatchSensor', enabled: true, trigger_types: [ 'linux.file_watch.line' ]},
  { ref: 'core.TimersSensor', enabled: true, trigger_types: [ 'core.st2.CronTimer', 'core.st2.IntervalTimer' ]},
];

// The store is shared by every test in the file, so empty it out again.
function reset() {
  store.dispatch({ type: 'SET_FILTER', filter: '' });
  store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: []});
  store.dispatch({ type: 'FETCH_SENSORS', status: 'success', payload: []});
  store.dispatch({ type: 'FETCH_INSTANCES', status: 'success', payload: []});
}

const groupRefs = () => store.getState().groups.map(({ pack, triggers }) => [ pack, triggers.map(({ ref }) => ref) ]);

describe('triggers store', () => {
  beforeEach(reset);

  describe('FETCH_GROUPS', () => {
    it('groups trigger types by pack, sorted by ref', () => {
      store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: TRIGGERS });

      expect(store.getState().triggers).to.equal(TRIGGERS);
      expect(groupRefs()).to.deep.equal([
        [ 'core', [ 'core.st2.CronTimer', 'core.st2.IntervalTimer', 'core.st2.webhook' ]],
        [ 'linux', [ 'linux.file_watch.line' ]],
      ]);
    });

    it('keeps the previous trigger types when the request fails', async () => {
      store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: TRIGGERS });

      await store.dispatch({ type: 'FETCH_GROUPS', promise: Promise.reject(new Error('boom')) });

      expect(store.getState().triggers).to.equal(TRIGGERS);
      expect(store.getState().groups).to.have.length(2);
    });
  });

  it('filters groups by ref, ignoring case, including types fetched later', () => {
    store.dispatch({ type: 'SET_FILTER', filter: 'TIMER' });
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: TRIGGERS });

    expect(groupRefs()).to.deep.equal([
      [ 'core', [ 'core.st2.CronTimer', 'core.st2.IntervalTimer' ]],
    ]);

    store.dispatch({ type: 'SET_FILTER', filter: 'nope' });
    expect(store.getState().groups).to.deep.equal([]);
    expect(store.getState().triggers).to.have.length(4);
  });

  describe('FETCH_SENSORS', () => {
    it('indexes sensors by every trigger type they emit', () => {
      store.dispatch({ type: 'FETCH_SENSORS', status: 'success', payload: SENSORS });

      const { sensors } = store.getState();
      expect(Object.keys(sensors).sort()).to.deep.equal([
        'core.st2.CronTimer',
        'core.st2.IntervalTimer',
        'linux.file_watch.line',
      ]);
      expect(sensors['core.st2.CronTimer']).to.equal(SENSORS[1]);
      expect(sensors['core.st2.IntervalTimer']).to.equal(SENSORS[1]);
    });

    it('keeps the previous sensors when the request fails', async () => {
      store.dispatch({ type: 'FETCH_SENSORS', status: 'success', payload: SENSORS });

      await store.dispatch({ type: 'FETCH_SENSORS', promise: Promise.reject(new Error('boom')) });

      expect(store.getState().sensors['linux.file_watch.line']).to.equal(SENSORS[0]);
    });
  });

  it('updates the sensor of every trigger type it emits when it is toggled', async () => {
    store.dispatch({ type: 'FETCH_SENSORS', status: 'success', payload: SENSORS });

    await store.dispatch({
      type: 'TOGGLE_ENABLE',
      promise: Promise.resolve({ ...SENSORS[1], ref: 'ignored', enabled: false }),
    });

    const { sensors } = store.getState();
    expect(sensors['core.st2.CronTimer']).to.include({ ref: 'core.TimersSensor', enabled: false });
    expect(sensors['core.st2.IntervalTimer']).to.include({ ref: 'core.TimersSensor', enabled: false });
    expect(sensors['linux.file_watch.line']).to.equal(SENSORS[0]);

    await store.dispatch({ type: 'TOGGLE_ENABLE', promise: Promise.reject(new Error('boom')) });
    expect(store.getState().sensors['core.st2.CronTimer'].enabled).to.be.false;
  });

  describe('instances', () => {
    const INSTANCES = [
      { id: 'i1', status: 'processed' },
      { id: 'i2', status: 'processed' },
    ];

    it('stores fetched instances and keeps them when a later fetch fails', async () => {
      store.dispatch({ type: 'FETCH_INSTANCES', status: 'success', payload: INSTANCES });
      expect(store.getState().instances).to.equal(INSTANCES);

      await store.dispatch({ type: 'FETCH_INSTANCES', promise: Promise.reject(new Error('boom')) });
      expect(store.getState().instances).to.equal(INSTANCES);
    });

    it('attaches enforcements to the instance they were fetched for', () => {
      const enforcements = [{ id: 'e1', rule: { ref: 'core.notify' }}];
      store.dispatch({ type: 'FETCH_INSTANCES', status: 'success', payload: INSTANCES });

      store.dispatch({ type: 'FETCH_ENFORCEMENTS', id: 'i2', status: 'success', payload: enforcements });

      const { instances } = store.getState();
      expect(instances[1]).to.deep.equal({ id: 'i2', status: 'processed', enforcements });
      expect(instances[0]).to.equal(INSTANCES[0]);
      // the fetched list itself is left alone
      expect(INSTANCES[1].enforcements).to.be.undefined;

      store.dispatch({ type: 'FETCH_ENFORCEMENTS', id: 'gone', status: 'success', payload: enforcements });
      expect(store.getState().instances).to.equal(instances);
    });
  });

  it('tracks the collapsed state of its flex tables', () => {
    store.dispatch(flexActions.register('core', false));
    store.dispatch(flexActions.register('linux', false));

    store.dispatch(flexActions.toggle('core'));
    expect(store.getState().tables.core.collapsed).to.be.true;
    expect(store.getState().collapsed).to.be.false;

    store.dispatch(flexActions.toggleAll());
    expect(store.getState().collapsed).to.be.true;
    expect(store.getState().tables.linux.collapsed).to.be.true;
  });
});
