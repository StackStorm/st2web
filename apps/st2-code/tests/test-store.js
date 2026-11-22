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
import { omit } from 'lodash';

import store from '../store';

const TRIGGERS = [
  { ref: 'core.st2.webhook', pack: 'core' },
  { ref: 'linux.file_watch.line', pack: 'linux' },
  { ref: 'core.st2.CronTimer', pack: 'core' },
];

const SENSOR = {
  ref: 'linux.FileWatchSensor',
  enabled: true,
  trigger_types: [ 'linux.file_watch.line', 'linux.file_watch.created' ],
};

const groupRefs = () => Object.fromEntries(
  store.getState().groups.map(({ pack, triggers }) => [ pack, triggers.map(({ ref }) => ref) ])
);

// The scoped store lives on the shared root store, so put back what earlier tests changed.
function reset() {
  store.dispatch({ type: 'SET_FILTER', filter: '' });
  store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: [] });
  store.dispatch({ type: 'FETCH_SENSORS', status: 'success', payload: [] });
  store.dispatch({ type: 'FETCH_INSTANCES', status: 'success', payload: [] });
}

describe('code store', () => {
  beforeEach(reset);

  it('groups trigger types by pack, sorted by ref, and filters them', () => {
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: TRIGGERS });

    expect(groupRefs()).to.deep.equal({
      core: [ 'core.st2.CronTimer', 'core.st2.webhook' ],
      linux: [ 'linux.file_watch.line' ],
    });

    store.dispatch({ type: 'SET_FILTER', filter: 'CRON' });
    expect(groupRefs()).to.deep.equal({ core: [ 'core.st2.CronTimer' ] });

    // a refetch keeps the filter
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: [ ...TRIGGERS, { ref: 'aws.cron', pack: 'aws' }] });
    expect(groupRefs()).to.deep.equal({ aws: [ 'aws.cron' ], core: [ 'core.st2.CronTimer' ] });
  });

  it('keeps the previous list while a fetch is pending or after it fails', () => {
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: TRIGGERS });

    store.dispatch({ type: 'FETCH_GROUPS' });
    store.dispatch({ type: 'FETCH_GROUPS', status: 'error', error: new Error('boom') });

    expect(store.getState().triggers).to.equal(TRIGGERS);
  });

  it('indexes sensors by the trigger types they emit', () => {
    store.dispatch({ type: 'FETCH_SENSORS', status: 'success', payload: [ SENSOR ] });

    const { sensors } = store.getState();
    expect(sensors).to.have.keys('linux.file_watch.line', 'linux.file_watch.created');
    expect(sensors['linux.file_watch.line']).to.equal(SENSOR);
  });

  it('updates the sensor of every trigger type it emits once toggled', () => {
    store.dispatch({ type: 'FETCH_SENSORS', status: 'success', payload: [ SENSOR ] });

    store.dispatch({ type: 'TOGGLE_ENABLE' });
    store.dispatch({ type: 'TOGGLE_ENABLE', status: 'error', error: new Error('no') });
    expect(store.getState().sensors['linux.file_watch.line'].enabled).to.be.true;

    // the API answers without the ref; the one already known is kept
    store.dispatch({ type: 'TOGGLE_ENABLE', status: 'success', payload: { ...omit(SENSOR, 'ref'), enabled: false }});

    const { sensors } = store.getState();
    expect(sensors['linux.file_watch.line']).to.include({ enabled: false, ref: 'linux.FileWatchSensor' });
    expect(sensors['linux.file_watch.created']).to.include({ enabled: false, ref: 'linux.FileWatchSensor' });
  });

  it('attaches enforcements to the trigger instance they belong to', () => {
    const instances = [{ id: 'i1' }, { id: 'i2' }];
    store.dispatch({ type: 'FETCH_INSTANCES', status: 'success', payload: instances });

    store.dispatch({ type: 'FETCH_ENFORCEMENTS', id: 'i2', status: 'success', payload: [{ id: 'enf' }] });
    store.dispatch({ type: 'FETCH_ENFORCEMENTS', id: 'missing', status: 'success', payload: [{ id: 'lost' }] });

    expect(store.getState().instances).to.deep.equal([{ id: 'i1' }, { id: 'i2', enforcements: [{ id: 'enf' }] }]);
    // the fetched list itself is left untouched
    expect(instances[1]).to.not.have.property('enforcements');
  });
});
