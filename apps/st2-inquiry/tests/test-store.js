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

const inquiry = (id, extra) => ({ id, status: 'pending', schema: { type: 'object', properties: {}}, ...extra });

describe('inquiry store', () => {
  // The scoped store lives in the shared root store for the whole file, so start from known data.
  beforeEach(async () => {
    await store.dispatch({ type: 'FETCH_INQUIRIES', promise: Promise.resolve([]) });
    await store.dispatch({ type: 'FETCH_INQUIRY', promise: Promise.resolve(undefined) });
  });

  it('starts with an empty list and no inquiry selected', () => {
    const { inquiries, inquiry } = store.getState();

    expect(inquiries).to.deep.equal([]);
    expect(inquiry).to.be.undefined;
  });

  it('stores the fetched inquiries', async () => {
    const list = [ inquiry('a'), inquiry('b', { status: 'succeeded' }) ];

    await store.dispatch({ type: 'FETCH_INQUIRIES', promise: Promise.resolve(list) });

    expect(store.getState().inquiries).to.deep.equal(list);
  });

  it('keeps the previous list while a fetch is pending or after it fails', async () => {
    const list = [ inquiry('a') ];
    await store.dispatch({ type: 'FETCH_INQUIRIES', promise: Promise.resolve(list) });

    store.dispatch({ type: 'FETCH_INQUIRIES' });
    expect(store.getState().inquiries).to.deep.equal(list);

    await store.dispatch({ type: 'FETCH_INQUIRIES', promise: Promise.reject(new Error('boom')) });
    expect(store.getState().inquiries).to.deep.equal(list);
  });

  it('stores the fetched inquiry, and keeps it when the next fetch fails', async () => {
    await store.dispatch({ type: 'FETCH_INQUIRY', promise: Promise.resolve(inquiry('a')) });
    expect(store.getState().inquiry).to.deep.equal(inquiry('a'));

    store.dispatch({ type: 'FETCH_INQUIRY', status: 'error', error: new Error('boom') });
    expect(store.getState().inquiry).to.deep.equal(inquiry('a'));
  });

  it('records the response on the current inquiry', async () => {
    await store.dispatch({ type: 'FETCH_INQUIRY', promise: Promise.resolve(inquiry('a')) });

    await store.dispatch({
      type: 'RESPOND_INQUIRY',
      promise: Promise.resolve({ id: 'a', response: { approved: true }}),
    });

    expect(store.getState().inquiry.response).to.deep.equal({ approved: true });
  });

  it('ignores responses to a different inquiry', async () => {
    await store.dispatch({ type: 'FETCH_INQUIRY', promise: Promise.resolve(inquiry('a')) });

    store.dispatch({ type: 'RESPOND_INQUIRY', status: 'success', payload: { id: 'b', response: { approved: true }}});

    expect(store.getState().inquiry.response).to.be.undefined;
  });

  it('tracks the collapsed state of the status tables', () => {
    store.dispatch(flexActions.register('pending', false));
    store.dispatch(flexActions.register('succeeded', false));
    expect(store.getState().collapsed).to.be.false;

    store.dispatch(flexActions.toggleAll());
    expect(store.getState().collapsed).to.be.true;
    expect(store.getState().tables.pending.collapsed).to.be.true;
    expect(store.getState().tables.succeeded.collapsed).to.be.true;

    store.dispatch(flexActions.toggle('pending'));
    expect(store.getState().tables.pending.collapsed).to.be.false;
    expect(store.getState().collapsed).to.be.false;
  });
});
