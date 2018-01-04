import { expect } from 'chai';
import sinon from 'sinon';

import '@stackstorm/module-test-utils/bootstrap/events';
import proportional from '..';

describe('proportional', () => {
  let spyAdd;
  let spyRemove;
  let makeProportional;
  before(() => {
    spyAdd = sinon.spy(global.window, 'addEventListener');
    spyRemove = sinon.spy(global.window, 'removeEventListener');

    makeProportional = proportional();
  });
  after(() => {
    spyAdd.restore();
    spyRemove.restore();
  });

  it('adds and removes event listeners', () => {
    makeProportional({});
    expect(spyAdd.callCount).to.equal(1);
    expect(spyRemove.callCount).to.equal(0);

    makeProportional(null);
    expect(spyAdd.callCount).to.equal(1);
    expect(spyRemove.callCount).to.equal(1);
  });
});
