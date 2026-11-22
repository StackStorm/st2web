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

import store, { createScopedStore } from '..';

// The root store is a module singleton and scoped stores can't be removed, so every test
// registers its own uniquely named scope.
let counter = 0;
const scopeName = () => `test-scope-${counter += 1}`;

// Records the actions a scoped reducer is called with.
const recordingReducer = () => (state = { actions: [] }, action) => ({
  actions: state.actions.concat(action),
});

describe('st2-store', () => {
  describe('createScopedStore', () => {
    it('initialises its slice with the reducer default', () => {
      const name = scopeName();
      const scoped = createScopedStore(name, (state = { ready: true }) => state);

      expect(scoped.getState()).to.deep.equal({ ready: true });
      expect(store.getState()[name]).to.equal(scoped.getState());
    });

    it('sends scoped actions only to its own reducer, without the routing key', () => {
      const first = createScopedStore(scopeName(), recordingReducer());
      const second = createScopedStore(scopeName(), recordingReducer());

      first.dispatch({ type: 'PING', value: 1 });

      expect(first.getState().actions.map(({ type }) => type)).to.deep.equal([ '@@st2/INIT', 'PING' ]);
      expect(first.getState().actions[1]).to.deep.equal({ type: 'PING', value: 1 });
      expect(second.getState().actions.map(({ type }) => type)).to.deep.equal([ '@@st2/INIT' ]);
    });

    it('gives every scoped reducer the actions dispatched on the root store', () => {
      const first = createScopedStore(scopeName(), recordingReducer());
      const second = createScopedStore(scopeName(), recordingReducer());

      store.dispatch({ type: 'BROADCAST' });

      expect(first.getState().actions.pop()).to.deep.equal({ type: 'BROADCAST' });
      expect(second.getState().actions.pop()).to.deep.equal({ type: 'BROADCAST' });
    });

    it('shares subscriptions with the root store', () => {
      const scoped = createScopedStore(scopeName(), recordingReducer());
      const listener = sinon.spy();
      const unsubscribe = scoped.subscribe(listener);

      store.dispatch({ type: 'ANYTHING' });
      unsubscribe();
      store.dispatch({ type: 'ANYTHING' });

      expect(listener.calledOnce).to.be.true;
    });
  });

  describe('root state', () => {
    it('collects registered routes without passing them to scoped reducers', () => {
      const scoped = createScopedStore(scopeName(), recordingReducer());
      const before = store.getState().routes || [];

      store.dispatch({ type: 'REGISTER_ROUTE', payload: { url: '/one' }});
      store.dispatch({ type: 'REGISTER_ROUTE', payload: [{ url: '/two' }, { url: '/three' }] });

      expect(store.getState().routes.slice(before.length)).to.deep.equal([
        { url: '/one' },
        { url: '/two' },
        { url: '/three' },
      ]);
      expect(scoped.getState().actions.map(({ type }) => type)).to.deep.equal([ '@@st2/INIT' ]);
    });

    it('keeps the location from the router reducer', () => {
      store.dispatch({ type: 'CHANGE_LOCATION', location: { pathname: '/actions/core.local' }});

      expect(store.getState().location).to.deep.equal({ pathname: '/actions/core.local', search: '', hash: '' });
    });

    it('keeps the location when a scoped action is dispatched', () => {
      const scoped = createScopedStore(scopeName(), recordingReducer());

      store.dispatch({ type: 'CHANGE_LOCATION', location: { pathname: '/history', search: '?page=2' }});
      scoped.dispatch({ type: 'PING' });

      expect(store.getState().location).to.deep.equal({ pathname: '/history', search: '?page=2', hash: '' });
    });
  });

  describe('promise middleware', () => {
    it('dispatches a pending action, then a success action with the payload', async () => {
      const scoped = createScopedStore(scopeName(), recordingReducer());

      const result = scoped.dispatch({ type: 'FETCH', id: 7, promise: Promise.resolve([ 'a', 'b' ]) });

      const [ , pending ] = scoped.getState().actions;
      expect(pending).to.deep.equal({ type: 'FETCH', id: 7, status: undefined });
      expect(pending).not.to.have.property('promise');

      await result;

      const [ , , success ] = scoped.getState().actions;
      expect(success).to.deep.equal({ type: 'FETCH', id: 7, status: 'success', payload: [ 'a', 'b' ] });
    });

    it('dispatches an error action when the promise rejects', async () => {
      const scoped = createScopedStore(scopeName(), recordingReducer());
      const error = new Error('boom');

      await scoped.dispatch({ type: 'FETCH', promise: Promise.reject(error) });

      const [ , pending, failure ] = scoped.getState().actions;
      expect(pending.status).to.be.undefined;
      expect(failure).to.deep.equal({ type: 'FETCH', status: 'error', error });
    });

    it('passes plain actions straight through', () => {
      const action = { type: 'PLAIN' };

      expect(store.dispatch(action)).to.equal(action);
    });
  });
});
