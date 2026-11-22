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

const PACKS = [
  { ref: 'zabbix', status: 'available' },
  { ref: 'core', status: 'installed' },
  { ref: 'aws', status: 'available' },
  { ref: 'Linux', status: 'installed' },
  { ref: 'chatops', status: 'installing' },
  { ref: 'st2', status: 'uninstalling' },
];

// The store is shared by every test in the file, so put it back to an empty pack list.
function reset() {
  store.dispatch({ type: 'SET_FILTER', filter: '' });
  store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: [] });
  store.dispatch({ type: 'FETCH_PACK', status: 'success', payload: undefined });
}

function load(packs = PACKS) {
  store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: packs });
}

const groupRefs = () => store.getState().groups.map(({ status, packs }) => [ status, packs.map(({ ref }) => ref) ]);

// A promise the test settles by hand, to look at the state while an action is still pending.
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('packs store', () => {
  beforeEach(reset);

  describe('FETCH_GROUPS', () => {
    it('groups packs by status, in lifecycle order, sorted by ref', () => {
      load();

      expect(store.getState().packs).to.equal(PACKS);
      expect(groupRefs()).to.deep.equal([
        [ 'installed', [ 'Linux', 'core' ]],
        [ 'installing', [ 'chatops' ]],
        [ 'uninstalling', [ 'st2' ]],
        [ 'available', [ 'aws', 'zabbix' ]],
      ]);
    });

    it('keeps the previous packs while pending and on error', async () => {
      load();

      const request = deferred();
      const done = store.dispatch({ type: 'FETCH_GROUPS', promise: request.promise });
      expect(store.getState().packs).to.equal(PACKS);

      request.reject(new Error('boom'));
      await done;

      expect(store.getState().packs).to.equal(PACKS);
      expect(groupRefs()[0]).to.deep.equal([ 'installed', [ 'Linux', 'core' ]]);
    });
  });

  describe('SET_FILTER', () => {
    it('narrows groups to refs containing the filter, ignoring case', () => {
      load();

      store.dispatch({ type: 'SET_FILTER', filter: 'L' });

      expect(store.getState().filter).to.equal('L');
      expect(groupRefs()).to.deep.equal([
        [ 'installed', [ 'Linux' ]],
      ]);
      // the full list is kept, so clearing the filter brings everything back
      expect(store.getState().packs).to.have.length(PACKS.length);
    });

    it('applies to packs fetched later and yields no groups when nothing matches', () => {
      store.dispatch({ type: 'SET_FILTER', filter: 'nothing-like-this' });
      load();

      expect(store.getState().groups).to.deep.equal([]);

      store.dispatch({ type: 'SET_FILTER', filter: 'a' });
      expect(groupRefs()).to.deep.equal([
        [ 'installing', [ 'chatops' ]],
        [ 'available', [ 'aws', 'zabbix' ]],
      ]);
    });
  });

  describe('FETCH_PACK', () => {
    it('selects the fetched pack and keeps it when a later fetch fails', async () => {
      store.dispatch({ type: 'FETCH_PACK', status: 'success', payload: PACKS[1] });
      expect(store.getState().pack).to.equal(PACKS[1]);

      await store.dispatch({ type: 'FETCH_PACK', promise: Promise.reject(new Error('404')) });
      expect(store.getState().pack).to.equal(PACKS[1]);
    });
  });

  describe('INSTALL_PACK', () => {
    beforeEach(() => {
      load();
      store.dispatch({ type: 'FETCH_PACK', status: 'success', payload: PACKS[2] });
    });

    it('moves the pack to "installing" and then "installed"', async () => {
      const request = deferred();
      const done = store.dispatch({ type: 'INSTALL_PACK', ref: 'aws', promise: request.promise });

      expect(store.getState().pack).to.include({ ref: 'aws', status: 'installing' });
      expect(groupRefs()).to.deep.include([ 'installing', [ 'aws', 'chatops' ]]);
      expect(groupRefs()).to.deep.include([ 'available', [ 'zabbix' ]]);

      request.resolve({});
      await done;

      expect(store.getState().pack).to.include({ ref: 'aws', status: 'installed' });
      expect(groupRefs()[0]).to.deep.equal([ 'installed', [ 'Linux', 'aws', 'core' ]]);
      expect(store.getState().packs.filter(({ ref }) => ref === 'aws')).to.have.length(1);
    });

    it('puts the pack back to "available" when the installation fails', async () => {
      await store.dispatch({ type: 'INSTALL_PACK', ref: 'aws', promise: Promise.reject(new Error('boom')) });

      expect(store.getState().pack).to.include({ ref: 'aws', status: 'available' });
      expect(groupRefs()).to.deep.include([ 'available', [ 'aws', 'zabbix' ]]);
    });

    it('leaves the selected pack alone when installing another one', async () => {
      await store.dispatch({ type: 'INSTALL_PACK', ref: 'zabbix', promise: Promise.resolve({}) });

      expect(store.getState().pack).to.equal(PACKS[2]);
      expect(groupRefs()[0]).to.deep.equal([ 'installed', [ 'Linux', 'core', 'zabbix' ]]);
    });
  });

  describe('UNINSTALL_PACK', () => {
    beforeEach(() => {
      load();
      store.dispatch({ type: 'FETCH_PACK', status: 'success', payload: PACKS[1] });
    });

    it('moves the pack to "uninstalling" and then "available"', async () => {
      const request = deferred();
      const done = store.dispatch({ type: 'UNINSTALL_PACK', ref: 'core', promise: request.promise });

      expect(store.getState().pack).to.include({ ref: 'core', status: 'uninstalling' });
      expect(groupRefs()).to.deep.include([ 'uninstalling', [ 'core', 'st2' ]]);

      request.resolve({});
      await done;

      expect(store.getState().pack).to.include({ ref: 'core', status: 'available' });
      expect(groupRefs()).to.deep.include([ 'available', [ 'aws', 'core', 'zabbix' ]]);
      expect(groupRefs()[0]).to.deep.equal([ 'installed', [ 'Linux' ]]);
    });

    it('puts the pack back to "installed" when the removal fails', async () => {
      await store.dispatch({ type: 'UNINSTALL_PACK', ref: 'core', promise: Promise.reject(new Error('boom')) });

      expect(store.getState().pack).to.include({ ref: 'core', status: 'installed' });
      expect(groupRefs()[0]).to.deep.equal([ 'installed', [ 'Linux', 'core' ]]);
    });
  });

  it('leaves packs untouched on CONFIGURE_PACK', async () => {
    load();
    const { packs, groups } = store.getState();

    await store.dispatch({ type: 'CONFIGURE_PACK', promise: Promise.resolve() });

    expect(store.getState().packs).to.equal(packs);
    expect(store.getState().groups).to.equal(groups);
  });

  it('tracks the collapsed state of its flex tables', () => {
    store.dispatch(flexActions.register('installed', false));
    store.dispatch(flexActions.register('available', false));
    expect(store.getState().collapsed).to.be.false;

    store.dispatch(flexActions.toggleAll());
    expect(store.getState().collapsed).to.be.true;
    expect(store.getState().tables.installed.collapsed).to.be.true;

    store.dispatch(flexActions.toggle('installed'));
    expect(store.getState().collapsed).to.be.false;
  });
});
