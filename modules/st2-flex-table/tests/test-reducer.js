// Copyright 2019 Extreme Networks, Inc.
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

import { expect } from 'chai';
import { uniqueId } from 'lodash';

import reducer, { actions } from '../flex-table.reducer.js';
import { createScopedStore } from '@stackstorm/module-store';

let store;

describe('FlexTable reducer', () => {
  beforeEach(() => {
    store = createScopedStore(uniqueId('tests'), reducer);
  });

  it('registers a flex table', () => {
    let state;

    store.dispatch(actions.register('one'));

    state = store.getState();
    expect(state.tables).to.have.property('one').that.has.property('collapsed', false);
    expect(state.tables).to.not.have.property('two');

    store.dispatch(actions.register('two', true));

    state = store.getState();
    expect(state.tables).to.have.property('one').that.has.property('collapsed', false);
    expect(state.tables).to.have.property('two').that.has.property('collapsed', true);
  });

  it('toggles one flex table', () => {
    let state;

    store.dispatch(actions.register('one', true));
    store.dispatch(actions.register('two'));

    state = store.getState();
    expect(state.tables).to.have.property('one').that.has.property('collapsed', true);
    expect(state.tables).to.have.property('two').that.has.property('collapsed', false);
    expect(state).to.have.property('collapsed', false);

    store.dispatch(actions.toggle('two'));

    state = store.getState();
    expect(state.tables).to.have.property('one').that.has.property('collapsed', true);
    expect(state.tables).to.have.property('two').that.has.property('collapsed', true);
    expect(state).to.have.property('collapsed', true);
  });

  it('toggles all flex tables', () => {
    let state;

    store.dispatch(actions.register('one', true));
    store.dispatch(actions.register('two'));

    state = store.getState();
    expect(state.tables).to.have.property('one').that.has.property('collapsed', true);
    expect(state.tables).to.have.property('two').that.has.property('collapsed', false);
    expect(state).to.have.property('collapsed', false);

    store.dispatch(actions.toggleAll());

    state = store.getState();
    expect(state.tables).to.have.property('one').that.has.property('collapsed', true);
    expect(state.tables).to.have.property('two').that.has.property('collapsed', true);
    expect(state).to.have.property('collapsed', true);
  });
});
