import { expect } from 'chai';
import { uniqueId } from 'lodash';

import reducer, { actions } from '../flex-table.reducer.js';
import { createScopedStore } from '../../../store.js';

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
